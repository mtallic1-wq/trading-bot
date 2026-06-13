"""
NQ/ES NYSE Bias Bot — Web Dashboard
Start: python web.py
Opens at: http://localhost:5050
"""
import json
import threading
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, send_from_directory, abort, request

BASE_DIR    = Path(__file__).parent
REPORTS_DIR = BASE_DIR / "reports"
STATIC_DIR  = BASE_DIR / "static"

app = Flask(__name__, static_folder=str(STATIC_DIR))

# ── Background job store ──────────────────────────────────────────────────────
_jobs = {}   # job_id -> {"status": "running"|"done"|"error", "result": ..., "error": ...}


def _run_job(job_id, fn, *args):
    try:
        result = fn(*args)
        # Convert report to JSON-safe dict
        _jobs[job_id] = {"status": "done", "result": result}
    except Exception as e:
        _jobs[job_id] = {"status": "error", "error": str(e)}


def _start_job(fn, *args):
    job_id = str(uuid.uuid4())[:8]
    _jobs[job_id] = {"status": "running"}
    t = threading.Thread(target=_run_job, args=(job_id, fn) + args, daemon=True)
    t.start()
    return job_id


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(str(STATIC_DIR), "dashboard.html")


# Reports
@app.route("/api/reports")
def list_reports():
    files = sorted(REPORTS_DIR.glob("*.json"), reverse=True)
    return jsonify([f.stem for f in files])


@app.route("/api/report/<date>")
def get_report(date):
    fp = REPORTS_DIR / f"{date}.json"
    if not fp.exists():
        abort(404, description=f"No report for {date}")
    return jsonify(json.loads(fp.read_text(encoding="utf-8")))


# Trigger analysis
@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    date_str = data.get("date") or None
    from bot import TradingBot
    bot = TradingBot()
    job_id = _start_job(bot.run_analysis, date_str)
    return jsonify({"job_id": job_id})


# Poll job status
@app.route("/api/job/<job_id>")
def job_status(job_id):
    job = _jobs.get(job_id)
    if not job:
        abort(404, description="Unknown job")
    return jsonify(job)


# Live news
@app.route("/api/news")
def news():
    def _fetch():
        from scrapers.yahoo import get_all_yahoo_news
        from scrapers.tradingview import get_all_tradingview_data
        date_str = datetime.now().strftime("%Y-%m-%d")
        return {
            "fetched_at": datetime.now().isoformat(),
            "yahoo": get_all_yahoo_news(),
            "tradingview": get_all_tradingview_data(date_str),
        }
    job_id = _start_job(_fetch)
    return jsonify({"job_id": job_id})


if __name__ == "__main__":
    import os
    STATIC_DIR.mkdir(exist_ok=True)
    port = int(os.environ.get("PORT", 8080))
    print(f"\n  NYSE Bias Bot — Web Dashboard")
    print(f"  http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
