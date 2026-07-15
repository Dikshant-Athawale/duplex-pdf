from pydantic import BaseModel, Field
from typing import Literal

class ImposeConfig(BaseModel):
    rows: int = Field(gt=0, description="Number of rows in the grid")
    cols: int = Field(gt=0, description="Number of columns in the grid")
    flip_mode: Literal["long_edge", "short_edge"] = Field("long_edge", description="Duplex printing flip mode")
    page_width: float = Field(..., description="Output sheet width in points")
    page_height: float = Field(..., description="Output sheet height in points")
    margin_top: float = Field(0.0, description="Top margin in points")
    margin_bottom: float = Field(0.0, description="Bottom margin in points")
    margin_left: float = Field(0.0, description="Left margin in points")
    margin_right: float = Field(0.0, description="Right margin in points")
    spacing_x: float = Field(0.0, description="Horizontal gap between cards in points")
    spacing_y: float = Field(0.0, description="Vertical gap between cards in points")
    crop_marks: bool = Field(False, description="Whether to draw crop marks")
    bleed: float = Field(0.0, description="Optional bleed per card in points")
    card_width: float | None = Field(None, description="Explicit card width; otherwise auto-computed")
    card_height: float | None = Field(None, description="Explicit card height; otherwise auto-computed")
    manual_duplex: bool = Field(False, description="Generate two separate PDFs (fronts/backs)")
    test_pattern: bool = Field(False, description="Generate a test pattern instead of using source PDF")
