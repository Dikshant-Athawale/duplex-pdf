import typer
from pathlib import Path
import json
import math
from duplex_impose.config import ImposeConfig
from duplex_impose.source import SourceDeck
from duplex_impose.render import render_imposed_pdf
from duplex_impose.test_pattern import generate_test_pattern
from duplex_impose.layout import compute_card_size

app = typer.Typer(help="PDF Duplex Grid Imposer")

@app.command()
def impose(
    input_pdf: Path | None = typer.Argument(None, help="Path to the source PDF. Optional if --test-pattern is used"),
    output_pdf: Path = typer.Option("output.pdf", "--output", "-o", help="Path to the output PDF"),
    grid: str = typer.Option("3x3", help="Grid size, e.g. 3x3"),
    flip_mode: str = typer.Option("long_edge", help="long_edge or short_edge"),
    page_size: str = typer.Option("letter", help="letter or a4"),
    margin: float = typer.Option(36.0, help="Margin in points (default 36 for 0.5 inch)"),
    spacing: float = typer.Option(0.0, help="Spacing between cards in points"),
    crop_marks: bool = typer.Option(False, "--crop-marks", help="Draw crop marks"),
    bleed: float = typer.Option(0.0, "--bleed", help="Bleed per card in points"),
    manual_duplex: bool = typer.Option(False, "--manual-duplex", help="Generate two separate PDFs (fronts/backs)"),
    test_pattern: bool = typer.Option(False, "--test-pattern", help="Generate a test pattern instead of using an input PDF"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Print computed layout without writing a file"),
    config_file: Path | None = typer.Option(None, "--config", help="Load settings from JSON config file")
):
    if config_file and config_file.exists():
        with open(config_file, "r") as f:
            data = json.load(f)
            # Override options with config file values if they exist
            grid = data.get("grid", grid)
            flip_mode = data.get("flip_mode", flip_mode)
            page_size = data.get("page_size", page_size)
            margin = data.get("margin", margin)
            spacing = data.get("spacing", spacing)
            crop_marks = data.get("crop_marks", crop_marks)
            bleed = data.get("bleed", bleed)
            manual_duplex = data.get("manual_duplex", manual_duplex)

    if not input_pdf and not test_pattern:
        typer.echo("Error: Missing argument 'INPUT_PDF'. Required unless --test-pattern is used.", err=True)
        raise typer.Exit(1)
        
    if bleed > 0 and not crop_marks:
        typer.echo(typer.style("Warning: Bleed is set but crop marks are disabled. Cut lines may not be visible.", fg=typer.colors.YELLOW))

    try:
        rows_str, cols_str = grid.lower().split("x")
        rows = int(rows_str)
        cols = int(cols_str)
    except ValueError:
        typer.echo("Invalid grid format. Use ROWS x COLS, e.g. 3x3", err=True)
        raise typer.Exit(1)
        
    if page_size.lower() == "letter":
        width, height = 612.0, 792.0
    elif page_size.lower() == "a4":
        width, height = 595.276, 841.890
    else:
        typer.echo(f"Unsupported page size: {page_size}. Defaulting to letter.", err=True)
        width, height = 612.0, 792.0
        
    if flip_mode not in ("long_edge", "short_edge"):
        typer.echo("flip_mode must be 'long_edge' or 'short_edge'", err=True)
        raise typer.Exit(1)
        
    config = ImposeConfig(
        rows=rows,
        cols=cols,
        flip_mode=flip_mode, # type: ignore
        page_width=width,
        page_height=height,
        margin_top=margin,
        margin_bottom=margin,
        margin_left=margin,
        margin_right=margin,
        spacing_x=spacing,
        spacing_y=spacing,
        crop_marks=crop_marks,
        bleed=bleed,
        manual_duplex=manual_duplex,
        test_pattern=test_pattern
    )
    
    if test_pattern:
        typer.echo("Generating test pattern...")
        source_buffer = generate_test_pattern(config, num_cards=rows*cols*2)
        deck = SourceDeck(source_buffer)
    else:
        typer.echo(f"Loading {input_pdf}...")
        deck = SourceDeck(input_pdf)  # type: ignore
    
    if deck.page_count % 2 != 0:
        typer.echo(typer.style(f"Warning: Source PDF has {deck.page_count} pages (odd number). The last card's back will be blank.", fg=typer.colors.YELLOW))

    if dry_run:
        card_w, card_h = compute_card_size(config)
        cards_per_sheet = config.rows * config.cols
        total_cards = math.ceil(deck.page_count / 2)
        total_sheets = math.ceil(total_cards / cards_per_sheet)
        
        typer.echo("\n--- DRY RUN LAYOUT PREVIEW ---")
        typer.echo(f"Input pages : {deck.page_count}")
        typer.echo(f"Grid        : {grid}")
        typer.echo(f"Sheet size  : {width:.1f} x {height:.1f} pts")
        typer.echo(f"Card size   : {card_w:.1f} x {card_h:.1f} pts")
        typer.echo(f"Total cards : {total_cards}")
        typer.echo(f"Total sheets: {total_sheets}")
        typer.echo("------------------------------\n")
        return
        
    typer.echo(f"Imposing into {grid} grid...")
    render_imposed_pdf(deck, config, str(output_pdf))
    
    if manual_duplex:
        base_path = str(output_pdf).rsplit(".", 1)
        name = base_path[0]
        ext = f".{base_path[1]}" if len(base_path) > 1 else ".pdf"
        typer.echo(typer.style(f"Success! Saved to {name}_fronts{ext} and {name}_backs{ext}", fg=typer.colors.GREEN))
    else:
        typer.echo(typer.style(f"Success! Saved to {output_pdf}", fg=typer.colors.GREEN))

if __name__ == "__main__":
    app()
