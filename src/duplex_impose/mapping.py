from typing import Literal

FlipMode = Literal["long_edge", "short_edge"]

def get_front_source_page(card_index: int) -> int:
    """Returns the 0-indexed source page number for the front of card i."""
    return 2 * card_index

def get_back_source_page(card_index: int) -> int:
    """Returns the 0-indexed source page number for the back of card i."""
    return 2 * card_index + 1

def get_back_grid_position(
    front_row: int,
    front_col: int,
    rows: int,
    cols: int,
    flip_mode: FlipMode = "long_edge"
) -> tuple[int, int]:
    """
    Given a grid position on the front sheet, compute the mirrored grid position on the back sheet.
    """
    if flip_mode == "long_edge":
        return front_row, cols - 1 - front_col
    elif flip_mode == "short_edge":
        return rows - 1 - front_row, front_col
    else:
        raise ValueError(f"Unknown flip_mode: {flip_mode}")
