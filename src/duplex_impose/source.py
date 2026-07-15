from pathlib import Path
from pypdf import PdfReader, PageObject

import io

class SourceDeck:
    def __init__(self, source: Path | str | io.BytesIO):
        self.reader = PdfReader(source)
        self.page_count = len(self.reader.pages)

    def get_page(self, index: int) -> PageObject | None:
        """
        Returns the page at the given 0-based index.
        Returns None if the index is >= page_count, allowing the caller 
        to handle padding (e.g., drawing a blank page).
        """
        if index < self.page_count:
            return self.reader.pages[index]
        return None
