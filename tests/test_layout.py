import pytest
from duplex_impose.config import ImposeConfig
from duplex_impose.layout import compute_card_size, get_cell_position

def test_compute_card_size_auto():
    config = ImposeConfig(
        rows=3, cols=3,
        page_width=600, page_height=900,
        margin_left=15, margin_right=15,
        margin_top=30, margin_bottom=30,
        spacing_x=10, spacing_y=10
    )
    # usable width = 600 - 30 - 20 = 550. card_width = 550 / 3 = 183.333
    # usable height = 900 - 60 - 20 = 820. card_height = 820 / 3 = 273.333
    card_w, card_h = compute_card_size(config)
    assert card_w == pytest.approx(183.333, abs=0.01)
    assert card_h == pytest.approx(273.333, abs=0.01)

def test_compute_card_size_explicit():
    config = ImposeConfig(
        rows=3, cols=3,
        page_width=600, page_height=900,
        card_width=100, card_height=150
    )
    card_w, card_h = compute_card_size(config)
    assert card_w == 100
    assert card_h == 150

def test_get_cell_position():
    config = ImposeConfig(
        rows=2, cols=2,
        page_width=100, page_height=100,
        margin_left=10, margin_top=10,
        spacing_x=5, spacing_y=5
    )
    # card size: 30x30
    # row 0, col 0 -> x = 10, y_top = 100 - 10 = 90 -> y = 60
    # row 0, col 1 -> x = 10 + 30 + 5 = 45, y = 60
    # row 1, col 0 -> x = 10, y_top = 100 - 10 - 30 - 5 = 55 -> y = 25
    x, y = get_cell_position(0, 0, config, 30, 30)
    assert x == 10
    assert y == 60
    
    x, y = get_cell_position(0, 1, config, 30, 30)
    assert x == 45
    assert y == 60
    
    x, y = get_cell_position(1, 0, config, 30, 30)
    assert x == 10
    assert y == 25
