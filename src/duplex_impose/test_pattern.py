import io
from reportlab.pdfgen import canvas
from duplex_impose.config import ImposeConfig
from duplex_impose.layout import compute_card_size

def generate_test_pattern(config: ImposeConfig, num_cards: int = 18) -> io.BytesIO:
    """
    Generates a dummy PDF containing front/back pairs.
    Returns it as a BytesIO stream suitable for SourceDeck.
    """
    buffer = io.BytesIO()
    
    card_w, card_h = compute_card_size(config)
    
    c = canvas.Canvas(buffer, pagesize=(card_w, card_h))
    
    for i in range(1, num_cards * 2 + 1):
        # Draw border
        c.setLineWidth(2)
        c.rect(0, 0, card_w, card_h, stroke=1, fill=0)
        
        # Draw number
        c.setFont("Helvetica-Bold", 36)
        text = str(i)
        text_w = c.stringWidth(text, "Helvetica-Bold", 36)
        c.drawString((card_w - text_w) / 2, card_h / 2, text)
        
        # Add "FRONT" or "BACK" indicator
        c.setFont("Helvetica", 14)
        side_text = "FRONT" if i % 2 != 0 else "BACK"
        side_w = c.stringWidth(side_text, "Helvetica", 14)
        c.drawString((card_w - side_w) / 2, card_h / 2 - 24, side_text)
        
        # Add card index
        card_idx = (i - 1) // 2 + 1
        idx_text = f"Card {card_idx}"
        idx_w = c.stringWidth(idx_text, "Helvetica", 14)
        c.drawString((card_w - idx_w) / 2, card_h - 30, idx_text)
        
        c.showPage()
    
    c.save()
    buffer.seek(0)
    return buffer
