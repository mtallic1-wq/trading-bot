import os
from pathlib import Path
from dotenv import load_dotenv

# --- Paths ---
BASE_DIR = Path(__file__).parent

# Always load .env from the project root, regardless of working directory
load_dotenv(BASE_DIR / ".env")

PERSISTENT_STORAGE_DIR = os.environ.get("PERSISTENT_STORAGE_DIR")
if PERSISTENT_STORAGE_DIR:
    PERSISTENT_DIR = Path(PERSISTENT_STORAGE_DIR)
else:
    PERSISTENT_DIR = BASE_DIR

REPORTS_DIR = PERSISTENT_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

# Auto-populate persistent directory with default reports from the repo if using a volume
if PERSISTENT_STORAGE_DIR:
    base_reports_dir = BASE_DIR / "reports"
    if base_reports_dir.exists() and base_reports_dir != REPORTS_DIR:
        import shutil
        for f in base_reports_dir.glob("*.json"):
            dest_file = REPORTS_DIR / f.name
            if not dest_file.exists():
                try:
                    shutil.copy2(f, dest_file)
                except Exception as e:
                    print(f"[Storage Warning] Failed to copy default report {f.name}: {e}")

# --- API ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL   = "llama-3.3-70b-versatile"

# --- Market Symbols (yfinance) ---
NQ_TICKER  = "NQ=F"       # E-mini Nasdaq-100 futures
DXY_TICKER = "DX-Y.NYB"  # Dollar Index
VIX_TICKER = "^VIX"
TNX_TICKER = "^TNX"       # 10-year Treasury yield
GC_TICKER  = "GC=F"       # Gold futures
CL_TICKER  = "CL=F"       # Crude Oil futures

# --- Analysis Settings ---
SWING_LOOKBACK = 5    # bars each side for swing detection
DAILY_BARS     = 60   # daily candles to load

# --- Websites ---
YAHOO_URL        = "https://finance.yahoo.com/"
WORLDMONITOR_URL = "https://www.worldmonitor.app"
TRADINGVIEW_NQ   = "https://www.tradingview.com/chart/?symbol=CME_MINI%3ANQ1%21"
