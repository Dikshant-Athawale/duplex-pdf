from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any
import tempfile
import os
import json
import math
import zipfile
from pathlib import Path

from duplex_impose.config import ImposeConfig
from duplex_impose.source import SourceDeck
from duplex_impose.render import render_imposed_pdf
from duplex_impose.test_pattern import generate_test_pattern
from duplex_impose.layout import compute_card_size, get_cell_position
from duplex_impose.mapping import get_front_source_page, get_back_source_page, get_back_grid_position

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class LayoutRequest(BaseModel):
    config: dict
    page_count: int

@app.post("/api/layout")
def get_layout(req: LayoutRequest):
    """
    Returns the exact grid mapping (which source page goes to which cell, 
    and where that cell is) so the frontend can render accurate previews natively.
    """
    try:
        cfg = ImposeConfig(**req.config)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    card_w, card_h = compute_card_size(cfg)
    cards_per_sheet = cfg.rows * cfg.cols
    total_cards = math.ceil(req.page_count / 2)
    total_sheets = math.ceil(total_cards / cards_per_sheet)
    
    sheets = []
    
    for sheet_idx in range(total_sheets):
        card_offset = sheet_idx * cards_per_sheet
        
        front_cells = []
        back_cells = []
        
        for row in range(cfg.rows):
            for col in range(cfg.cols):
                cell_card_idx = row * cfg.cols + col
                global_card_idx = card_offset + cell_card_idx
                
                # Front
                front_src_idx = get_front_source_page(global_card_idx)
                if front_src_idx < req.page_count:
                    fx, fy = get_cell_position(row, col, cfg, card_w, card_h)
                    front_cells.append({
                        "row": row, "col": col,
                        "source_page": front_src_idx,
                        "x": fx, "y": fy, "w": card_w, "h": card_h,
                        "card_idx": global_card_idx
                    })
                
                # Back
                back_src_idx = get_back_source_page(global_card_idx)
                if back_src_idx < req.page_count:
                    back_row, back_col = get_back_grid_position(row, col, cfg.rows, cfg.cols, cfg.flip_mode)
                    bx, by = get_cell_position(back_row, back_col, cfg, card_w, card_h)
                    back_cells.append({
                        "row": back_row, "col": back_col,
                        "source_page": back_src_idx,
                        "x": bx, "y": by, "w": card_w, "h": card_h,
                        "card_idx": global_card_idx
                    })
        
        sheets.append({
            "sheet_idx": sheet_idx,
            "front": front_cells,
            "back": back_cells
        })
        
    return {
        "page_width": cfg.page_width,
        "page_height": cfg.page_height,
        "total_sheets": total_sheets,
        "total_cards": total_cards,
        "sheets": sheets
    }

@app.post("/api/export")
def export_pdf(
    config_json: str = Form(...),
    file: UploadFile | None = File(None)
):
    try:
        cfg_dict = json.loads(config_json)
        cfg = ImposeConfig(**cfg_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid config: {e}")
        
    if not file and not cfg.test_pattern:
        raise HTTPException(status_code=400, detail="Must provide PDF file or enable test_pattern")
        
    if file and not cfg.test_pattern:
        if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")
            
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.pdf")
    output_path = os.path.join(temp_dir, "output.pdf")
    
    if cfg.test_pattern:
        num_cards = cfg.rows * cfg.cols * 2 # Just 2 sheets worth for test pattern
        source_buffer = generate_test_pattern(cfg, num_cards)
        deck = SourceDeck(source_buffer)
    else:
        file_bytes = file.file.read()
        if len(file_bytes) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB.")
        if not file_bytes.startswith(b'%PDF'):
            raise HTTPException(status_code=400, detail="File is not a valid PDF.")
        with open(input_path, "wb") as f:
            f.write(file_bytes)
        try:
            deck = SourceDeck(input_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Corrupt or encrypted PDF: {e}")
        
    try:
        render_imposed_pdf(deck, cfg, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if cfg.manual_duplex:
        # Zip the two files
        zip_path = os.path.join(temp_dir, "output.zip")
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.write(os.path.join(temp_dir, "output_fronts.pdf"), "output_fronts.pdf")
            zf.write(os.path.join(temp_dir, "output_backs.pdf"), "output_backs.pdf")
        return FileResponse(zip_path, media_type="application/zip", filename="imposed_duplex.zip")
    else:
        return FileResponse(output_path, media_type="application/pdf", filename="imposed.pdf")
