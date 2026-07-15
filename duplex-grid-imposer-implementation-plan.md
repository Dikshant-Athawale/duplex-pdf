# PDF Duplex Grid Imposer — Implementation Plan

## 1. Goal & Scope

Build a tool that takes a source PDF containing sequential paired pages (front/back content for cards) and produces a single **print-ready, duplex-imposed PDF**: a front sheet and a back sheet per output page, arranged in a grid, with the back sheet correctly mirrored so that after duplex printing and cutting, each card's front and back line up.

Deliverable: a CLI tool + a small library core, with an optional web UI wrapper later.

---

## 2. Tech Stack Recommendation

| Concern | Choice | Why |
|---|---|---|
| Language | Python 3.11+ | Best PDF tooling maturity, fast to build/iterate |
| PDF read/manipulate | `pypdf` (page extraction, merging) | Pure Python, no system deps, good page-transform support |
| PDF page composition | `reportlab` (canvas) + `pypdf` for embedding source pages as XObjects | reportlab gives precise control over placement, rotation, mirroring, crop marks |
| CLI | `typer` or `argparse` | Typer gives clean UX with minimal code |
| Config validation | `pydantic` | Validate grid size, margins, flip mode, etc. |
| Testing | `pytest` + `pikepdf` for structural assertions | pikepdf can inspect resulting page count/geometry for automated checks |
| Packaging | `pip`-installable package, optional `pyinstaller` binary later | Easy distribution to non-technical users (teachers, print shops) |

If a web UI is wanted later: FastAPI backend wrapping the same core library, simple upload → download flow. Keep the core logic UI-agnostic from day one so this is a thin wrapper, not a rewrite.

---

## 3. Core Data Model

```python
class ImposeConfig:
    rows: int
    cols: int
    flip_mode: Literal["long_edge", "short_edge"]
    page_size: tuple[float, float]        # output sheet size, e.g. Letter/A4 in points
    margin_top: float
    margin_bottom: float
    margin_left: float
    margin_right: float
    spacing_x: float                       # gap between cards horizontally
    spacing_y: float                       # gap between cards vertically
    crop_marks: bool
    bleed: float                           # optional bleed per card, points
    card_size: tuple[float, float] | None  # explicit card size; else auto-computed from grid+margins
```

```python
class SourceDeck:
    pdf_path: Path
    page_count: int
    # Validation: page_count must be even (front/back pairs).
    # If odd, either error or auto-pad with a blank page (configurable).
```

---

## 4. Core Algorithm (validated against the spec document)

This matches the "Universal Algorithm" section exactly:

```
front_page(i) = 2*i + 1     (1-indexed source page for card i)
back_page(i)  = 2*i + 2

back_row    = front_row
back_column = C - 1 - front_column
```

### 4.1 Step-by-step pipeline

1. **Load** source PDF, get total page count `N`. Validate `N` is even; if not, pad with a blank page (warn user) or reject, per config flag.
2. **Compute cards_per_sheet** = `rows * cols`.
3. **Compute number of output sheet-pairs** needed:
   `num_cards = N / 2`
   `num_sheets = ceil(num_cards / cards_per_sheet)`
4. **For each sheet**, build two output pages: a *front page* and a *back page*.
   - For each grid position `(r, c)` on the front page, compute the card index `i` (row-major order: `i = r * cols + c`, offset by sheet number × cards_per_sheet).
   - Front source page = `front_page(i)`.
   - Place it at grid position `(r, c)` on the front output page.
   - Back source page = `back_page(i)`.
   - Place it at grid position `(r, C - 1 - c)` on the back output page (the mirrored column — this is the key transform from the spec).
5. **Handle a partial final sheet** (fewer cards than `cards_per_sheet`): leave remaining grid cells blank on both front and back, but keep the *same mirroring logic* per occupied cell — mirroring is a property of the grid geometry, not of how many cells are filled.
6. **Render each grid cell**:
   - Compute cell bounding box from margins, spacing, and card size.
   - Scale/fit the source page into the cell (see §4.3 on fit modes).
   - If bleed is configured, extend the placement area outward accordingly (see §5.4).
7. **Draw crop marks** at cell corners if enabled (see §5.3).
8. **Assemble output**: interleave front/back sheets in physical duplex order — i.e., front(sheet 1), back(sheet 1), front(sheet 2), back(sheet 2), ... This ordering must match the printer driver's duplex expectation (see §5.1 on long-edge vs short-edge).
9. **Write final PDF** to disk.

### 4.2 Flip-mode handling (long edge vs short edge)

This is the part not explicitly covered in the source spec but essential for correctness:

- **Long-edge flip** (the common default, "flip on long edge"): the mirroring described in the spec (column reversal, same row) is correct as-is.
- **Short-edge flip** (duplex printer flips top-to-bottom instead of left-to-right): the back page must instead have **rows mirrored, columns unchanged**:
  ```
  back_row    = R - 1 - front_row
  back_column = front_column
  ```
  This is a genuine variant of the same principle, symmetric to the documented one. Implement both, selected via `flip_mode` in config, and make `long_edge` the default since it's most common on office/home duplex printers.
- Add a **"page orientation" self-check** in a test render: generate a simple numbered test PDF (card 1..N) and visually confirm alignment before trusting real content. Ship this as a `--test-pattern` CLI flag that generates a labeled grid instead of using a real source PDF — very useful for users to calibrate their own printer before committing real content.

### 4.3 Fit modes for source pages into grid cells

Source pages likely won't exactly match the computed cell size. Support:
- `fit`: scale uniformly to fit inside the cell, centered (default, safest).
- `fill`: scale uniformly to cover the cell, cropping overflow.
- `stretch`: scale independently in x/y to exactly match cell size (distorts aspect ratio — warn if used).

---

## 5. Supporting Features

### 5.1 Duplex order & printer instructions
Output a short text panel (or a `--print-instructions` flag that prints to console) telling the user exactly what printer settings to select: duplex mode, flip edge, "print on both sides automatically" vs. manual (print odd pages, flip stack, print even pages). Manual duplex is common for cheaper printers — support it via a `--manual-duplex` flag that outputs **two separate PDFs** (all fronts, then all backs in matching order) instead of one interleaved file.

### 5.2 Margins & spacing
- Margins define the outer, non-printable border of the sheet.
- Spacing defines gaps between cards (useful so cutting doesn't clip adjacent cards).
- Auto-compute card size from `(page_size - margins - spacing) / grid` unless the user supplies an explicit card size (e.g., standard 2.5"×3.5" trading card, 3"×5" index card).

### 5.3 Crop marks
Draw short corner tick marks (typically 3–5mm long, offset ~2mm from the actual cut line) at each card's corners on **both** front and back sheets, in the same physical sheet position — never inside the card's bleed/content area. Use a light gray or black hairline stroke.

### 5.4 Bleed
If bleed > 0, the source content is placed slightly larger than the nominal card size, extending past the cut line by the bleed amount, and crop marks are offset outward accordingly. Warn the user if source PDF pages don't have enough extra imagery to support bleed (this is a common print-production pitfall — can't manufacture bleed from a page that's exactly card-sized).

### 5.5 Non-square / uneven grids
Algorithm already generalizes to any `rows × cols` (rectangular grids, e.g., 2×4). No special-casing needed beyond what's in §4.

### 5.6 Odd total page count
Config option: `pad_strategy = "blank_back" | "error"`. Default to erroring with a clear message, since a silent blank back page is often *not* what the user wants (e.g., if they miscounted their source pages).

---

## 6. CLI Design

```bash
duplex-impose input.pdf \
  --grid 3x3 \
  --flip-mode long_edge \
  --page-size letter \
  --margin 0.5in \
  --spacing 0.1in \
  --crop-marks \
  --bleed 0.125in \
  --output output.pdf
```

Additional flags:
- `--manual-duplex` → emits `output_fronts.pdf` and `output_backs.pdf`
- `--test-pattern` → ignore input.pdf, generate numbered placeholder cards to calibrate printer settings
- `--card-size 2.5x3.5in` → override auto-computed card size
- `--fit {fit,fill,stretch}`
- `--dry-run` → print computed layout (sheet count, card size, cell positions) without writing a file

---

## 7. Module Structure

```
duplex_impose/
  __init__.py
  config.py        # ImposeConfig (pydantic model), validation
  layout.py         # grid geometry: cell positions, card size computation
  mapping.py        # front_page(i), back_page(i), mirroring logic (long/short edge)
  render.py         # reportlab canvas drawing: place pages, crop marks, bleed
  source.py         # load/validate source PDF, page extraction via pypdf
  cli.py            # typer entrypoint
  test_pattern.py   # generates numbered calibration PDF
tests/
  test_mapping.py    # unit tests against the exact tables in the spec (2x3, 3x3, 4x4)
  test_layout.py      # geometry math
  test_end_to_end.py  # generate a small PDF, run full pipeline, assert output page count/order
```

Keep `mapping.py` pure and dependency-free — it's the mathematical heart of the tool and should be exhaustively unit-tested against the worked examples in the spec document (2×3, 3×3, 4×4 tables) before anything else is built.

---

## 8. Testing Plan

1. **Unit tests for mapping logic**: hardcode the exact position-mapping tables from the spec (all three grid sizes) and assert the algorithm reproduces them precisely. This is the highest-value test since it's the core correctness guarantee.
2. **Geometry tests**: given page size/margins/spacing, assert computed cell rectangles don't overlap and fit within the sheet.
3. **Golden-file end-to-end tests**: run the full pipeline on a small synthetic input PDF (e.g., 6 pages, numbered) and diff the rendered output's page count and (via pikepdf) content stream structure against a checked-in expected output.
4. **Manual print test**: the `--test-pattern` mode should be run and physically printed/cut at least once during development to confirm real-world alignment, since floating point rounding or printer-driver margin quirks can't be caught by unit tests alone.
5. **Edge cases to explicitly test**: odd page count, partial final sheet, 1×1 grid (trivial case), very large grid (e.g., 5×5) for scaling, both flip modes.

---

## 9. Phased Roadmap

**Phase 1 — Core correctness (MVP)**
- `mapping.py` + tests matching the spec tables exactly
- Basic CLI: fixed grid, long-edge flip only, no crop marks/bleed
- Render simple centered "fit" placement
- Output: single interleaved PDF

**Phase 2 — Print-production features**
- Crop marks
- Bleed support
- Short-edge flip mode
- Manual duplex mode (two-file output)
- `--test-pattern` calibration mode

**Phase 3 — Usability**
- `--dry-run` layout preview
- Better error messages (odd page count, oversized card vs. sheet, etc.)
- Config file support (YAML/JSON) for repeatable presets (e.g., "standard trading card 3x3")

**Phase 4 — Optional web UI**
- FastAPI wrapper: upload PDF, pick grid/options via form, download result
- Reuse Phase 1–3 core untouched

---

## 10. Key Risks / Things to Get Right Early

- **Off-by-one errors in the mirroring formula** — verify against every table in the spec before writing any rendering code.
- **Confusing long-edge vs short-edge conventions** — printer driver terminology varies; ship the test-pattern mode specifically to let users self-diagnose which mode they need.
- **Coordinate system mismatches** between pypdf (page space) and reportlab (canvas space, often y-flipped) — write a small isolated geometry test early to confirm placement math before building the full pipeline on top of it.
- **Bleed without source bleed imagery** — this is a content problem, not a code problem; the tool should warn, not silently produce cards with white edges after trimming.
