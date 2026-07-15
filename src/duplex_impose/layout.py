from duplex_impose.config import ImposeConfig

def compute_card_size(config: ImposeConfig) -> tuple[float, float]:
    if config.card_width is not None and config.card_height is not None:
        return config.card_width, config.card_height
        
    usable_width = config.page_width - config.margin_left - config.margin_right - config.spacing_x * (config.cols - 1)
    usable_height = config.page_height - config.margin_top - config.margin_bottom - config.spacing_y * (config.rows - 1)
    
    return usable_width / config.cols, usable_height / config.rows

def get_cell_position(row: int, col: int, config: ImposeConfig, card_width: float, card_height: float) -> tuple[float, float]:
    """
    Returns the bottom-left coordinate (x, y) of the given grid cell.
    Note: reportlab uses bottom-up Y axis.
    """
    x = config.margin_left + col * (card_width + config.spacing_x)
    
    # row=0 is top row.
    y_top = config.page_height - config.margin_top - row * (card_height + config.spacing_y)
    y_bottom = y_top - card_height
    
    return x, y_bottom
