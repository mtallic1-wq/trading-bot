"""
NQ/ES NYSE Bias Bot — REST API
-------------------------------
Exposes the bot's functionality over HTTP using FastAPI.

Start with:
  python api.py
  # or
  uvicorn api:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
  POST /analyze              — Run analysis for today
  POST /analyze/{date}       — Run analysis for a specific date (YYYY-MM-DD)
  GET  /report/{date}        — Fetch a saved report
  GET  /reports              — List all saved report dates
  GET  /history?n=10         — Get last N saved reports (summary)
  GET  /news                 — Fetch latest live headlines
  GET  /health               — Health check
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse

from bot import TradingBot
from storage.store import list_reports, load_report, load_last_n


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.bot = TradingBot()
    yield

app = FastAPI(
    title="NQ/ES NYSE Bias Bot API",
    description="ICT/SMC market structure + macro + AI news analysis for NQ & ES futures.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"])
def health():
    """Simple liveness check."""
    return {"status": "ok", "time": datetime.now().isoformat()}


@app.get("/reports", tags=["reports"])
def get_report_list():
    """Return a sorted list of dates that have saved analyses."""
    dates = list_reports()
    return {"count": len(dates), "dates": dates}


@app.get("/report/{date}", tags=["reports"])
def get_report(date: str):
    """
    Fetch a previously saved analysis report.
    `date` must be YYYY-MM-DD format.
    """
    _validate_date(date)
    report = load_report(date)
    if report is None:
        raise HTTPException(
            status_code=404,
            detail=f"No saved analysis for {date}. Run POST /analyze/{date} first.",
        )
    return report


@app.get("/history", tags=["reports"])
def get_history(n: int = Query(default=10, ge=1, le=100, description="Number of recent reports")):
    """
    Return summaries for the last N saved reports (newest first).
    Each summary includes date, bias_nq, side, and created timestamp.
    """
    reports = load_last_n(n)
    summaries = [
        {
            "date":    r.get("date"),
            "created": r.get("created"),
            "bias_nq": r.get("bias_nq"),
            "side":    r.get("side"),
            "errors":  r.get("errors", []),
        }
        for r in reports
    ]
    return {"count": len(summaries), "history": summaries}


@app.post("/analyze", tags=["analysis"])
def analyze_today():
    """
    Run a full analysis for today and return the report.
    This is a blocking call — it may take 30–60 seconds.
    """
    bot: TradingBot = app.state.bot
    report = bot.run_analysis()
    return report


@app.post("/analyze/{date}", tags=["analysis"])
def analyze_date(date: str):
    """
    Run a full analysis for a specific date (YYYY-MM-DD) and return the report.
    Use this for historical back-fills.
    This is a blocking call — it may take 30–60 seconds.
    """
    _validate_date(date)
    bot: TradingBot = app.state.bot
    report = bot.run_analysis(date)
    return report


@app.get("/news", tags=["analysis"])
def get_news():
    """
    Fetch live headlines from Yahoo Finance and TradingView.
    Does NOT run a full analysis or save a report.
    """
    from scrapers.yahoo import get_all_yahoo_news
    from scrapers.tradingview import get_all_tradingview_data

    date_str = datetime.now().strftime("%Y-%m-%d")
    yahoo = get_all_yahoo_news()
    tv    = get_all_tradingview_data(date_str)
    return {
        "fetched_at": datetime.now().isoformat(),
        "yahoo":      yahoo,
        "tradingview": tv,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_date(date_str: str):
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format '{date_str}'. Use YYYY-MM-DD.",
        )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
