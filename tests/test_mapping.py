import pytest
from duplex_impose.mapping import get_back_grid_position, get_front_source_page, get_back_source_page

def test_source_page_mapping():
    assert get_front_source_page(0) == 0
    assert get_back_source_page(0) == 1
    
    assert get_front_source_page(1) == 2
    assert get_back_source_page(1) == 3

@pytest.mark.parametrize("rows,cols,front_row,front_col,expected_back_row,expected_back_col", [
    # 2x3 grid, long_edge
    (2, 3, 0, 0, 0, 2),
    (2, 3, 0, 1, 0, 1),
    (2, 3, 0, 2, 0, 0),
    (2, 3, 1, 0, 1, 2),
    (2, 3, 1, 1, 1, 1),
    (2, 3, 1, 2, 1, 0),
    # 3x3 grid, long_edge
    (3, 3, 0, 0, 0, 2),
    (3, 3, 0, 2, 0, 0),
    (3, 3, 2, 0, 2, 2),
    (3, 3, 2, 2, 2, 0),
])
def test_long_edge_flip(rows, cols, front_row, front_col, expected_back_row, expected_back_col):
    back_row, back_col = get_back_grid_position(front_row, front_col, rows, cols, flip_mode="long_edge")
    assert back_row == expected_back_row
    assert back_col == expected_back_col

@pytest.mark.parametrize("rows,cols,front_row,front_col,expected_back_row,expected_back_col", [
    # 2x3 grid, short_edge
    (2, 3, 0, 0, 1, 0),
    (2, 3, 0, 1, 1, 1),
    (2, 3, 0, 2, 1, 2),
    (2, 3, 1, 0, 0, 0),
    (2, 3, 1, 1, 0, 1),
    (2, 3, 1, 2, 0, 2),
])
def test_short_edge_flip(rows, cols, front_row, front_col, expected_back_row, expected_back_col):
    back_row, back_col = get_back_grid_position(front_row, front_col, rows, cols, flip_mode="short_edge")
    assert back_row == expected_back_row
    assert back_col == expected_back_col
