"""
AgriLens — Root Launcher
========================
Opens exactly 2 terminal windows:

  CMD 1 → Backend  (FastAPI  @ http://localhost:8000)
  CMD 2 → Frontend (React    @ http://localhost:3000)

Usage:
  python run.py
"""

import os
import sys
import subprocess
import platform
import shutil
import time
from pathlib import Path

# ── Resolve paths ─────────────────────────────────────────────────────────────
ROOT     = Path(__file__).parent.resolve()
BACKEND  = ROOT / "Backend"
FRONTEND = ROOT / "Frontend"


def print_banner():
    print(r"""
  █████╗  ██████╗ ██████╗ ██╗██╗     ███████╗███╗   ██╗███████╗
 ██╔══██╗██╔════╝ ██╔══██╗██║██║     ██╔════╝████╗  ██║██╔════╝
 ███████║██║  ███╗██████╔╝██║██║     █████╗  ██╔██╗ ██║███████╗
 ██╔══██║██║   ██║██╔══██╗██║██║     ██╔══╝  ██║╚██╗██║╚════██║
 ██║  ██║╚██████╔╝██║  ██║██║███████╗███████╗██║ ╚████║███████║
 ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
    """)
    print("  AgriLens — AI-Powered Farming Assistant")
    print("─" * 55)


def setup():
    """Install all dependencies in THIS terminal (no extra windows)."""

    # ── Python deps ──
    req = BACKEND / "requirements.txt"
    print("\n[Setup] Installing Python backend dependencies...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", str(req), "-q"],
        check=True,
    )
    print("[Setup] ✓  Python packages ready")

    # ── Node deps ──
    if not (FRONTEND / "node_modules").exists():
        print("[Setup] Installing npm packages (first run)...")
        subprocess.run(
            ["npm", "install"],
            cwd=str(FRONTEND),
            check=True,
            shell=True,
        )
        print("[Setup] ✓  npm packages ready")
    else:
        print("[Setup] ✓  node_modules already present")


def launch():
    """Open exactly 2 CMD windows — backend and frontend."""

    print("\n" + "─" * 55)
    print("  Launching servers...")
    print("─" * 55)

    if platform.system() == "Windows":
        # ── CMD 1: Backend ────────────────────────────────────────
        subprocess.Popen(
            f'start "AgriLens Backend" cmd /k "cd /d {BACKEND} && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"',
            shell=True,
        )

        time.sleep(1)

        # ── CMD 2: Frontend ───────────────────────────────────────
        subprocess.Popen(
            f'start "AgriLens Frontend" cmd /k "cd /d {FRONTEND} && npm start"',
            shell=True,
        )

    else:
        # Linux / macOS fallback
        if shutil.which("gnome-terminal"):
            subprocess.Popen(["gnome-terminal", "--title=AgriLens Backend",  "--", "bash", "-c", f"cd '{BACKEND}'  && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload; exec bash"])
            time.sleep(1)
            subprocess.Popen(["gnome-terminal", "--title=AgriLens Frontend", "--", "bash", "-c", f"cd '{FRONTEND}' && npm start; exec bash"])
        else:
            # Bare fallback — run backend in bg, frontend in fg
            subprocess.Popen(f"cd '{BACKEND}' && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload", shell=True)
            time.sleep(1)
            subprocess.run(f"cd '{FRONTEND}' && npm start", shell=True)

    print("""
  ✅  Two terminal windows opened:

  ┌─────────────────────────────────────────────┐
  │  CMD 1  →  Backend   http://localhost:8000   │
  │  CMD 2  →  Frontend  http://localhost:3000   │
  │                                             │
  │  API Docs → http://localhost:8000/docs       │
  └─────────────────────────────────────────────┘

  Close the CMD windows to stop the servers.
""")


if __name__ == "__main__":
    print_banner()
    setup()
    launch()
