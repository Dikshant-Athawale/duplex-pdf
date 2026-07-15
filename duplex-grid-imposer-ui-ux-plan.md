# PDF Duplex Grid Imposer — UI/UX Design Plan

## 0. Framing

The core anxiety this tool solves is trust: "will my back pages actually line up after I cut these?" Most imposition tools bury that answer in a PDF the user only sees after printing a full sheet of paper. The interface's whole job is to let the user **see the alignment before they spend paper and ink** — the preview isn't a nice-to-have, it's the product.

Audience: teachers, tabletop-game makers, and small print shops. Mixed technical comfort — some know "bleed" and "duplex short-edge" fluently, others have never heard the terms. The UI needs to work for both without babying the experts or losing the beginners.

Single job of the screen: **configure a grid, watch the front/back mapping prove itself correct, export.**

---

## 1. Design Language — Token System

Steering away from the three defaults (cream+terracotta+serif, near-black+neon, broadsheet hairline-newspaper): this tool lives in **prepress/print-production vernacular** — registration marks, crop marks, signatures, proofs, gutters. That world already has a real visual language, so we borrow from *it* rather than from generic SaaS or editorial design.

### Color

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FAF9F6` | App background — reads as stock paper, not white-white |
| `ink` | `#1C1C1A` | Primary text, line art, card content previews |
| `ink-soft` | `#5B5B57` | Secondary text, captions |
| `registration-cyan` | `#00AEEF` | Front-side indicator, primary interactive accent |
| `registration-magenta` | `#EC1C6E` | Back-side indicator, paired with cyan for front/back contrast |
| `proof-amber` | `#E8A33D` | Warnings (odd page count, insufficient bleed, oversized card) |
| `line` | `#DCD9D0` | Hairline dividers, grid rules — warm gray, not cold gray |

The cyan/magenta pairing isn't decorative — it's the actual convention prepress proofing uses for registration marks (the little crosshair targets printers use to check that color plates and, historically, front/back are aligned). Using it to mean **front = cyan, back = magenta** throughout the app gives the user a color code they can learn once and read everywhere: any time they see cyan and magenta elements land on top of each other, that's alignment made visible.

### Type

- **Display / numeric — `IBM Plex Mono`**: used for grid coordinates, page numbers, card counts, and the config panel's numeric fields. This is a spec-sheet, not a poster — a monospace face makes the grid math feel precise and scannable, and numbers align in columns naturally.
- **Body / UI — `IBM Plex Sans`**: same type family, different member, so display and body feel related without being identical. Used for labels, instructions, button text.
- **Scale**: 12 / 14 / 16 / 20 / 28 / 40px, restrained — this is a workbench, not a marketing page, so the type scale stays tight and utilitarian rather than dramatic.

### Layout concept

Three-zone **workbench**, not a wizard with forced next/back steps (the user should be able to jump straight to tweaking margins after seeing a bad preview, not walk backward through a linear flow):

```
┌─────────────┬───────────────────────────────┬──────────────┐
│  CONFIG      │        LIVE PREVIEW            │   OUTPUT      │
│  (left,      │        (center, largest)       │   (right,     │
│   ~280px)    │                                 │    ~260px)    │
│              │  [Front] [Back]  toggle         │               │
│  Grid: 3x3   │  ┌───────────────┐              │  6 sheets     │
│  Flip: long  │  │  1  3  5      │              │  18 cards     │
│  edge   ▼    │  │  7  9  11     │              │               │
│              │  │  13 15 17     │              │  ⚠ odd page   │
│  Margin      │  └───────────────┘              │    count      │
│  ▓▓▓▓░░░░    │                                 │               │
│              │                                 │  [Export PDF] │
│  Spacing     │                                 │               │
│  ▓▓░░░░░░    │                                 │               │
│              │                                 │               │
│  Crop marks ☑│                                 │               │
│  Bleed      ☐│                                 │               │
└─────────────┴───────────────────────────────┴──────────────┘
```

### Signature element

A **live registration-mark overlay** in the preview: when the user toggles between Front and Back (or drags a "flip" slider — see §3.2), a small cyan crosshair on the front grid and a magenta crosshair on the back grid animate toward each other and snap into a single overlapping mark at the exact moment the paper "flips." This is the one moment of delight/motion in the whole app, and it's not decorative — it *is* the proof that the imposition math is correct, made visible instead of asserted in text. Everything else in the UI stays quiet so this moment reads clearly.

---

## 2. User Journey / Information Architecture

Single-screen workbench (not multi-page wizard), four functional zones:

1. **Upload** — drop zone, empty until a PDF is loaded (or Test Pattern mode is chosen instead — see §3.5).
2. **Configure** (left panel) — grid size, flip mode, margins/spacing, card size, crop marks, bleed.
3. **Preview** (center) — the trust-building core; front/back toggle, page-map overview, warnings inline on the affected control.
4. **Export** (right panel) — summary stats, warnings roll-up, download button, printer-setting instructions.

No forced linear order after upload — every config change re-renders the preview live (debounced), so the user free-roams between config and preview until it looks right, then exports.

---

## 3. Screen-by-Screen Detail

### 3.1 Empty state / Upload

```
┌─────────────────────────────────────────────┐
│                                                │
│        ┌───────────────────────┐             │
│        │                        │             │
│        │   Drop a PDF here      │             │
│        │   or click to browse   │             │
│        │                        │             │
│        └───────────────────────┘             │
│                                                │
│   Don't have a file yet?                      │
│   [ Try a test pattern instead ]              │
│                                                │
└─────────────────────────────────────────────┘
```

Copy is written from the user's side of the screen: "Drop a PDF here" (what they do), not "Upload source document" (system language). The test-pattern offer is placed prominently in the empty state, not buried in an advanced menu — first-time users calibrating a new printer are a primary use case, not an edge case.

### 3.2 Configuration panel

- **Grid size**: a visual grid picker (click-drag across a small dot grid, like picking a table size in a spreadsheet menu) rather than two number inputs — this is faster to understand and matches how people already think about "3 by 3."
- **Flip mode**: not a dropdown of jargon. Two illustrated options, each a tiny animated diagram of a sheet of paper flipping over a **long edge** vs a **short edge**, with the resulting mirror direction sketched as an arrow. Label underneath in plain terms: "Flip along the long edge (most common)" / "Flip along the short edge." Users who don't know their printer's behavior are pointed to the test-pattern flow instead of guessing.
- **Margins / spacing**: sliders with live numeric readout in the mono type, not just number fields — dragging and watching the preview cards resize in real time closes the feedback loop faster than typing-and-tabbing.
- **Card size**: auto-computed value shown by default ("Auto: 2.33 × 3.17 in"), editable inline if the user wants a fixed standard size (a small preset menu: Trading card, Index card 3×5, Poker card, Custom).
- **Crop marks / bleed**: simple toggles. Turning on bleed with no margin for it in the source content triggers an inline `proof-amber` warning directly under the toggle — never a modal, never a toast that disappears before it's read.

### 3.3 Preview

- **Front/Back toggle**: a physical-feeling switch (styled like a two-position flip switch, reinforcing the paper-flip mental model) rather than tabs.
- Each grid cell in the preview shows the actual source page thumbnail (rendered at low-res for speed) with its page number in the corner, in mono type, small and unobtrusive.
- Hovering a cell on the Front highlights its paired cell on the Back simultaneously (via the shared card index, not position) — this is the single clearest way to demonstrate "these two are printed on the same physical card" without writing a paragraph of explanation.
- A secondary **"sheet map"** strip below the main preview shows thumbnails of every sheet in the job (1 of 6, 2 of 6, ...) so users with large decks can jump around without re-scrolling a long single preview.

### 3.4 Output / Export panel

- Plain-language stats first: "18 cards, 6 sheets" — not "N=18, sheets=ceil(...)".
- Warnings surfaced as a short list, each one a single sentence stating what's wrong and the fix, in the interface's voice, never apologetic or vague:
  - "Your source PDF has 17 pages — imposition needs pairs. Add a page or the last card will be blank on back."
  - "Bleed is set to 0.125 in but crop marks are off — cut lines may not be visible on this sheet."
- **Export button** is single and primary: "Export print-ready PDF." If manual duplex mode is on, it becomes two secondary buttons instead: "Download fronts" / "Download backs," visually paired (same width, side by side) so it's clear they're a set.
- Below export: a collapsed-by-default "Printer settings for this file" panel with the exact duplex/flip instruction to select at the print dialog — collapsed so it doesn't clutter the common case, but one click away for the manual-duplex printer crowd.

### 3.5 Test Pattern / Calibration mode

Same three-zone workbench, but the center preview is replaced with a **physical checklist overlay** after export:
1. Print this page.
2. Flip it exactly as instructed above.
3. Print the back.
4. Hold it up to the light — do the numbers line up?
5. [Yes, looks right] / [No, let me try the other flip mode]

This turns calibration into a guided physical loop rather than a one-shot PDF the user has to interpret alone — the "No" path re-renders instantly with the other flip mode selected, no need to reconfigure from scratch.

### 3.6 Empty / error states

- No file yet: inviting, not blank (see §3.1).
- Invalid PDF / corrupt file: "This file couldn't be read as a PDF. Try re-exporting it from its source application." — states what happened and a next step, no apology.
- Zero valid pages after padding logic: blocks export with a clear inline reason rather than producing a broken file.

---

## 4. Motion

Kept deliberately minimal outside the one signature moment:

- **Front/Back toggle switch**: a quick 150ms flip animation on the switch itself, echoing a card turning over.
- **Registration-mark snap** (§1, signature element): the one orchestrated moment — cyan and magenta crosshairs converge over ~400ms when toggling views, easing out, landing with a subtle snap/settle rather than a bounce (bounce would undercut the "precision" feeling the whole tool is selling).
- **Config changes**: preview updates cross-fade (~120ms), no sliding or zooming — the content changing is the point, not the transition.
- Respect `prefers-reduced-motion`: disable the crosshair convergence animation and cross-fades, replace with instant state changes.

---

## 5. Accessibility & Responsiveness

- Full keyboard operability: grid-size picker must be operable via arrow keys plus Enter, not drag-only; all sliders have paired number inputs.
- Visible focus rings in `registration-cyan` on all interactive elements (dual duty: accessibility and reinforcing the front/cyan color code).
- Color is never the only signal — the front/back distinction is backed by the "Front"/"Back" text label and the switch position, not cyan/magenta alone, for colorblind users.
- Responsive down to tablet width (three zones stack: Config → Preview → Output, in that order, each collapsible) since a print shop worker might configure on a tablet at a cutting station. Full mobile-phone support is a stretch goal, not a requirement — this is fundamentally a workbench tool used at a desk or a print station.

---

## 6. Component Inventory (for implementation handoff)

| Component | Notes |
|---|---|
| `GridSizePicker` | dot-grid drag-select, keyboard accessible |
| `FlipModeSelector` | two illustrated cards with mini flip animation, radio-selected |
| `SliderWithReadout` | margin/spacing controls, mono numeric readout |
| `CardSizeInput` | preset dropdown + custom w/h fields |
| `TogglePair` | crop marks / bleed, each with optional inline warning slot |
| `FrontBackSwitch` | physical-switch styled toggle, drives preview state |
| `PreviewGrid` | renders thumbnails per cell, hover-pairing highlight logic keyed by card index not position |
| `SheetMapStrip` | horizontal scroll of sheet thumbnails |
| `WarningList` | plain-sentence warnings, `proof-amber`, inline near the relevant control when possible, rolled up here otherwise |
| `ExportPanel` | primary/secondary button logic depending on manual-duplex state |
| `CalibrationChecklist` | test-pattern mode's guided physical loop |

---

## 7. Implementation Notes (ties back to the core system)

- Preview rendering can reuse the same `layout.py` / `mapping.py` core from the implementation plan — render low-res PNG thumbnails per cell server-side (or client-side via `pdf.js`) rather than duplicating the geometry math in the frontend. The UI must never compute its own copy of the mirroring formula — it always asks the same core the export path uses, so what you preview is guaranteed to be what you print.
- If built as the Phase 4 FastAPI web wrapper: preview updates on config change can hit a lightweight `/preview` endpoint returning cell thumbnails + warnings JSON, debounced ~200ms after the last input change, keeping the "live" feel without re-rendering on every keystroke.
- Suggested frontend stack: React + Tailwind for the workbench chrome, with `pdf.js` for in-browser thumbnail rendering if avoiding a server round-trip per preview is a priority.
