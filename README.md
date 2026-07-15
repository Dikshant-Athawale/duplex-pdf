# PDF Duplex Grid Imposer

A web-based tool for print-production and creators to impose multi-page PDFs onto grid layouts for accurate duplex (front/back) printing.

![Screenshot placeholders (add later)]()

## Features
- **Visual Imposition**: See exactly how your pages map to physical paper before you print.
- **Smart Duplexing**: Automatically calculates front/back pairing for standard "Print on both sides" or "Manual duplex" scenarios.
- **Test Patterns**: Generate a numbered test pattern to verify your printer's alignment and flip mode without wasting ink on your real design.
- **Fast Processing**: Client-server architecture handles heavy PDF manipulation efficiently.
- **Premium Dark Mode**: Built for professionals working in low-light creative environments.

## Architecture
- **Frontend**: React + Vite
- **Backend**: FastAPI (Python) with `pypdf` for reliable PDF manipulation.

## Local Development Setup

### 1. Backend (Python)
Ensure you have Python 3.11+ installed.

```bash
# From the root directory, create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .[dev]

# Run the FastAPI server
uvicorn duplex_impose.server:app --reload --port 8000
```

### 2. Frontend (React)
Ensure you have Node.js 18+ installed.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run the Vite dev server
npm run dev
```

The app will be available at `http://localhost:5173` (or whichever port Vite provides).

## Build for Production
To build the frontend for a static hosting provider (e.g. Vercel, Netlify):

```bash
cd frontend
npm run build
```
This generates a `dist/` directory ready for deployment.

## Deployment Notes
- **Frontend**: The static `dist/` bundle can be hosted anywhere. Ensure you set the `VITE_API_URL` environment variable to point to your live backend server.
- **Backend**: The FastAPI app must be deployed to a Python-capable host (e.g., Render, Railway, AWS). Ensure CORS settings in `server.py` are updated to allow your frontend's domain.

## License
MIT License. See `LICENSE` for details.
