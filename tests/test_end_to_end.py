import pytest
import tempfile
from pathlib import Path
import pikepdf
from pypdf import PdfWriter, PageObject
from duplex_impose.cli import app
from typer.testing import CliRunner

runner = CliRunner()

def create_dummy_pdf(path: Path, pages: int):
    writer = PdfWriter()
    for i in range(pages):
        # 100x150 points dummy page
        page = PageObject.create_blank_page(width=100, height=150)
        writer.add_page(page)
    with open(path, "wb") as f:
        writer.write(f)

def test_cli_end_to_end(tmp_path: Path):
    input_pdf = tmp_path / "input.pdf"
    output_pdf = tmp_path / "output.pdf"
    
    # Create 8 page PDF (4 cards, meaning 1 sheet since we'll use a 2x2 grid)
    create_dummy_pdf(input_pdf, 8)
    
    result = runner.invoke(app, [
        str(input_pdf),
        "--output", str(output_pdf),
        "--grid", "2x2",
        "--page-size", "letter",
        "--margin", "36"
    ])
    
    assert result.exit_code == 0
    assert output_pdf.exists()
    
    # 4 cards on a 2x2 grid fits on exactly 1 sheet (2 pages: front and back)
    with pikepdf.Pdf.open(str(output_pdf)) as pdf:
        assert len(pdf.pages) == 2

def test_cli_odd_pages(tmp_path: Path):
    input_pdf = tmp_path / "input_odd.pdf"
    output_pdf = tmp_path / "output_odd.pdf"
    
    create_dummy_pdf(input_pdf, 7) # 4 cards, last card has no back
    
    result = runner.invoke(app, [
        str(input_pdf),
        "--output", str(output_pdf),
        "--grid", "2x2",
        "--page-size", "letter"
    ])
    
    assert result.exit_code == 0
    assert "Warning: Source PDF has 7 pages" in result.stdout
    with pikepdf.Pdf.open(str(output_pdf)) as pdf:
        assert len(pdf.pages) == 2

def test_cli_manual_duplex(tmp_path: Path):
    input_pdf = tmp_path / "input.pdf"
    output_pdf = tmp_path / "output.pdf"
    create_dummy_pdf(input_pdf, 8)
    
    result = runner.invoke(app, [
        str(input_pdf),
        "--output", str(output_pdf),
        "--grid", "2x2",
        "--manual-duplex"
    ])
    
    assert result.exit_code == 0
    fronts_path = tmp_path / "output_fronts.pdf"
    backs_path = tmp_path / "output_backs.pdf"
    
    assert fronts_path.exists()
    assert backs_path.exists()
    assert not output_pdf.exists()

def test_cli_test_pattern(tmp_path: Path):
    output_pdf = tmp_path / "output.pdf"
    
    result = runner.invoke(app, [
        "--test-pattern",
        "--output", str(output_pdf),
        "--grid", "2x2",
        "--crop-marks",
        "--bleed", "10"
    ])
    
    assert result.exit_code == 0
    assert output_pdf.exists()

def test_cli_dry_run():
    result = runner.invoke(app, [
        "--test-pattern",
        "--grid", "2x2",
        "--dry-run"
    ])
    
    assert result.exit_code == 0
    assert "--- DRY RUN LAYOUT PREVIEW ---" in result.stdout
    assert "Grid        : 2x2" in result.stdout
