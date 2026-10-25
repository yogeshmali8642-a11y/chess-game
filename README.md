# Knightfall Chess Studio

A responsive, installable chess PWA with a Python backend. The interface is designed to be lightweight and does not load a frontend framework or external fonts.

## Features

- Responsive chessboard with click-to-move and legal-move hints
- Real chess rules and move validation through `python-chess` (`chess` on PyPI)
- Checkmate, stalemate, insufficient-material and automatic draw-rule detection
- Vs-computer and local two-player modes
- Casual, Club and Strong difficulty settings
- Uses Stockfish when installed; otherwise falls back to a small Python minimax/material bot
- Promotion chooser, undo, flip board, resignation and PGN copy
- PWA manifest and service worker for an installable app shell

## Run on Windows

1. Install Python 3.11 or newer from <https://www.python.org/downloads/>. During installation, enable **Add Python to PATH**.
2. Extract this folder somewhere writable.
3. Open PowerShell or Terminal in the `knightfall_chess` folder.
4. Install the packages:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install --upgrade pip
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

5. Start the app:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

6. Open <http://127.0.0.1:8000> in Chrome or Edge. Keep the terminal open while playing.

## Make the computer much stronger with Stockfish

The fallback bot lets the app work without installing a chess engine, but it is intentionally modest. For much stronger play, install Stockfish from its official download page:

<https://stockfishchess.org/download/>

Download the Windows build, extract it, and either:

- Put `stockfish.exe` in this project folder, **or**
- Set the `STOCKFISH_PATH` environment variable to the full path to the executable.

Example PowerShell command for the current terminal:

```powershell
$env:STOCKFISH_PATH = "C:\Tools\Stockfish\stockfish-windows-x86-64-avx2.exe"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Use the actual filename and path you downloaded. After starting, the right-hand panel should show **STOCKFISH**. Stockfish is a separate engine program, not a pure-Python package.

## Install as an app (PWA)

Open the running site in a supported browser. In Chrome or Edge, use the install icon in the address bar or the app's **Install app** control if it appears. A local `http://127.0.0.1` address is treated as a secure context for development. For installation on other devices, deploy the site over HTTPS and run the Python backend somewhere reachable by those devices.

The service worker caches the app shell, not the Python API or AI engine. **A running backend is still required to play chess.** This starter app keeps games in server memory; restarting the Python server clears active games.

## Project layout

```text
knightfall_chess/
  main.py                  # FastAPI backend, chess rules, engine integration
  requirements.txt
  static/
    index.html             # App shell
    styles.css             # Responsive UI
    app.js                 # Board interaction and rendering
    manifest.webmanifest   # PWA metadata
    sw.js                  # Static-shell cache
    icon.svg
```

## Architecture note

The chess rules, validation and server-side AI integration are Python. A genuine browser PWA still needs browser assets (HTML/CSS/JavaScript plus a web manifest and service worker); using Python alone would mean building a desktop application instead of a proper PWA.
