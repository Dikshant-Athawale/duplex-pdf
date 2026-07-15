import io
import math
from pypdf import PdfWriter, PageObject, Transformation, PdfReader
from duplex_impose.config import ImposeConfig
from duplex_impose.source import SourceDeck
from duplex_impose.mapping import get_front_source_page, get_back_source_page, get_back_grid_position
from duplex_impose.layout import compute_card_size, get_cell_position

def render_imposed_pdf(deck: SourceDeck, config: ImposeConfig, output_path: str):
    cards_per_sheet = config.rows * config.cols
    total_cards = math.ceil(deck.page_count / 2)
    total_sheets = math.ceil(total_cards / cards_per_sheet)
    
    card_width, card_height = compute_card_size(config)
    
    crop_marks_page = None
    if config.crop_marks:
        crop_marks_page = _generate_crop_marks(config, card_width, card_height)
    
    fronts_writer = PdfWriter()
    backs_writer = PdfWriter()
    
    for sheet_idx in range(total_sheets):
        front_sheet = PageObject.create_blank_page(width=config.page_width, height=config.page_height)
        back_sheet = PageObject.create_blank_page(width=config.page_width, height=config.page_height)
        
        card_offset = sheet_idx * cards_per_sheet
        
        for row in range(config.rows):
            for col in range(config.cols):
                cell_card_idx = row * config.cols + col
                global_card_idx = card_offset + cell_card_idx
                
                # 1. Front page
                front_src_idx = get_front_source_page(global_card_idx)
                front_src_page = deck.get_page(front_src_idx)
                
                if front_src_page:
                    fx, fy = get_cell_position(row, col, config, card_width, card_height)
                    _place_page(front_sheet, front_src_page, fx, fy, card_width, card_height, config.bleed)
                
                # 2. Back page
                back_src_idx = get_back_source_page(global_card_idx)
                back_src_page = deck.get_page(back_src_idx)
                
                if back_src_page:
                    back_row, back_col = get_back_grid_position(row, col, config.rows, config.cols, config.flip_mode)
                    bx, by = get_cell_position(back_row, back_col, config, card_width, card_height)
                    _place_page(back_sheet, back_src_page, bx, by, card_width, card_height, config.bleed)
        
        if crop_marks_page:
            front_sheet.merge_page(crop_marks_page)
            back_sheet.merge_page(crop_marks_page)
            
        fronts_writer.add_page(front_sheet)
        backs_writer.add_page(back_sheet)
        
    if config.manual_duplex:
        base_path = output_path.rsplit(".", 1)
        name = base_path[0]
        ext = f".{base_path[1]}" if len(base_path) > 1 else ".pdf"
        
        with open(f"{name}_fronts{ext}", "wb") as f:
            fronts_writer.write(f)
        with open(f"{name}_backs{ext}", "wb") as f:
            backs_writer.write(f)
    else:
        # Interleaved output
        combined_writer = PdfWriter()
        for i in range(total_sheets):
            combined_writer.add_page(fronts_writer.pages[i])
            combined_writer.add_page(backs_writer.pages[i])
        with open(output_path, "wb") as f:
            combined_writer.write(f)

def _place_page(target_sheet: PageObject, src_page: PageObject, cell_x: float, cell_y: float, cell_w: float, cell_h: float, bleed: float = 0.0):
    src_w = float(src_page.mediabox.width)
    src_h = float(src_page.mediabox.height)
    
    if src_w == 0 or src_h == 0:
        return
        
    # Scale to fill the logical card cell PLUS bleed on all sides
    target_w = cell_w + 2 * bleed
    target_h = cell_h + 2 * bleed
    
    scale_x = target_w / src_w
    scale_y = target_h / src_h
    scale = min(scale_x, scale_y)
    
    # Center within the bleed-expanded cell
    dx = cell_x - bleed + (target_w - src_w * scale) / 2
    dy = cell_y - bleed + (target_h - src_h * scale) / 2
    
    transform = Transformation().scale(scale, scale).translate(dx, dy)
    target_sheet.merge_transformed_page(src_page, transform)

def _generate_crop_marks(config: ImposeConfig, card_width: float, card_height: float) -> PageObject:
    from reportlab.pdfgen import canvas
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(config.page_width, config.page_height))
    c.setLineWidth(0.5)
    c.setStrokeColorRGB(0, 0, 0)
    
    mark_len = 10
    offset = 5
    
    for row in range(config.rows):
        for col in range(config.cols):
            x, y = get_cell_position(row, col, config, card_width, card_height)
            
            corners = [
                (x, y), 
                (x + card_width, y), 
                (x, y + card_height), 
                (x + card_width, y + card_height)
            ]
            
            for cx, cy in corners:
                dy_sign = -1 if cy == y else 1
                dx_sign = -1 if cx == x else 1
                
                # Vertical mark
                c.line(cx, cy + dy_sign * offset, cx, cy + dy_sign * (offset + mark_len))
                # Horizontal mark
                c.line(cx + dx_sign * offset, cy, cx + dx_sign * (offset + mark_len), cy)

    c.save()
    buffer.seek(0)
    return PdfReader(buffer).pages[0]
