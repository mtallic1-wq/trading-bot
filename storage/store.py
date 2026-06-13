"""
JSON-based storage for daily analysis reports.
Each report saved as reports/YYYY-MM-DD.json
"""
import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Optional, List

from config import REPORTS_DIR


def _path(date_str: str) -> Path:
    return REPORTS_DIR / f"{date_str}.json"


def save_report(report: Dict, date_str: Optional[str] = None) -> str:
    """Save a report dict to disk. Returns the file path."""
    if date_str is None:
        date_str = datetime.now().strftime("%Y-%m-%d")
    fp = _path(date_str)
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)
    return str(fp)


def load_report(date_str: str) -> Optional[Dict]:
    """Load a report for a specific date. Returns None if not found."""
    fp = _path(date_str)
    if not fp.exists():
        return None
    with open(fp, "r", encoding="utf-8") as f:
        return json.load(f)


def list_reports() -> List[str]:
    """Return sorted list of available report dates (YYYY-MM-DD)."""
    files = sorted(REPORTS_DIR.glob("*.json"), reverse=True)
    return [f.stem for f in files]


def load_last_n(n: int) -> List[Dict]:
    """Load the last N reports sorted newest first."""
    dates = list_reports()[:n]
    reports = []
    for d in dates:
        r = load_report(d)
        if r:
            reports.append(r)
    return reports
