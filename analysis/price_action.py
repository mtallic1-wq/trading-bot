"""
Gen1 Price Action — Multi-Timeframe Market Structure Analysis
-------------------------------------------------------------
Pure OHLCV analysis. No indicators. No ICT terminology.

Identifies:
  - Swing highs / swing lows (N-bar pivot)
  - Market structure: HH/HL (bullish), LH/LL (bearish), ranging
  - Break of structure (BOS) and Change of Character (CHoCH)
  - Multi-timeframe bias with weighted scoring

Timeframes analysed: Daily → 4H → 1H → 15m
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


# ── Swing Detection ───────────────────────────────────────────────────────────

def detect_swings(df: pd.DataFrame, n: int = 3) -> pd.DataFrame:
    """
    Find swing highs and swing lows using N-bar pivot logic.
    A swing high: high[i] > all highs in [i-n : i+n] (excluding i).
    A swing low:  low[i]  < all lows  in [i-n : i+n] (excluding i).

    Returns df with columns: swing_high, swing_low (NaN where not a swing).
    """
    highs = df["High"].values
    lows  = df["Low"].values
    size  = len(df)

    sh = np.full(size, np.nan)
    sl = np.full(size, np.nan)

    for i in range(n, size - n):
        window_h = np.concatenate([highs[i-n:i], highs[i+1:i+n+1]])
        window_l = np.concatenate([lows[i-n:i],  lows[i+1:i+n+1]])
        if highs[i] > window_h.max():
            sh[i] = highs[i]
        if lows[i] < window_l.min():
            sl[i] = lows[i]

    result = df.copy()
    result["swing_high"] = sh
    result["swing_low"]  = sl
    return result


# ── Structure Classification ──────────────────────────────────────────────────

def classify_structure(df_swings: pd.DataFrame, lookback: int = 6) -> Dict:
    """
    Classify market structure from recent swing sequence.

    Returns:
        structure:   "BULLISH" | "BEARISH" | "RANGING"
        last_swings: list of recent swing points with type/price/date
        bos:         most recent break of structure (or None)
        choch:       most recent change of character (or None)
    """
    sh_rows = df_swings[df_swings["swing_high"].notna()].tail(lookback)
    sl_rows = df_swings[df_swings["swing_low"].notna()].tail(lookback)

    sh_vals = sh_rows["swing_high"].values
    sl_vals = sl_rows["swing_low"].values

    # Score each sequence
    def sequence_score(vals: np.ndarray) -> float:
        if len(vals) < 2:
            return 0.0
        diffs = np.diff(vals)
        return float(np.sum(np.sign(diffs))) / len(diffs)

    sh_score = sequence_score(sh_vals)   # +1 = all HH, -1 = all LH
    sl_score = sequence_score(sl_vals)   # +1 = all HL, -1 = all LL
    combined = (sh_score + sl_score) / 2

    if combined >= 0.4:
        structure = "BULLISH"
    elif combined <= -0.4:
        structure = "BEARISH"
    else:
        structure = "RANGING"

    # Build recent swing list (merged, sorted by time)
    swings = []
    for idx, row in sh_rows.iterrows():
        swings.append({"type": "SH", "price": round(float(row["swing_high"]), 2),
                       "date": str(idx.date() if hasattr(idx, 'date') else idx)})
    for idx, row in sl_rows.iterrows():
        swings.append({"type": "SL", "price": round(float(row["swing_low"]), 2),
                       "date": str(idx.date() if hasattr(idx, 'date') else idx)})
    swings.sort(key=lambda x: x["date"])

    # BOS / CHoCH detection
    bos, choch = _detect_bos_choch(df_swings, structure, sh_rows, sl_rows)

    return {
        "structure": structure,
        "sh_score":  round(sh_score, 2),
        "sl_score":  round(sl_score, 2),
        "swings":    swings[-8:],
        "bos":       bos,
        "choch":     choch,
    }


def _detect_bos_choch(df: pd.DataFrame, structure: str,
                      sh_rows: pd.DataFrame, sl_rows: pd.DataFrame) -> Tuple:
    """Detect the most recent BOS and CHoCH."""
    if df.empty or (sh_rows.empty and sl_rows.empty):
        return None, None

    current_close = float(df["Close"].iloc[-1])
    bos = choch = None

    if structure == "BULLISH":
        # BOS: close above most recent swing high
        if not sh_rows.empty:
            last_sh = float(sh_rows["swing_high"].iloc[-1])
            last_sh_date = str(sh_rows.index[-1].date() if hasattr(sh_rows.index[-1], 'date') else sh_rows.index[-1])
            if current_close > last_sh:
                bos = {"direction": "BULLISH", "level": round(last_sh, 2),
                       "date": last_sh_date, "label": "BOS — broke above swing high"}
        # CHoCH: close below most recent swing low (structure flip)
        if not sl_rows.empty:
            last_sl = float(sl_rows["swing_low"].iloc[-1])
            last_sl_date = str(sl_rows.index[-1].date() if hasattr(sl_rows.index[-1], 'date') else sl_rows.index[-1])
            if current_close < last_sl:
                choch = {"direction": "BEARISH", "level": round(last_sl, 2),
                         "date": last_sl_date, "label": "CHoCH — broke below swing low (structure flip)"}

    elif structure == "BEARISH":
        # BOS: close below most recent swing low
        if not sl_rows.empty:
            last_sl = float(sl_rows["swing_low"].iloc[-1])
            last_sl_date = str(sl_rows.index[-1].date() if hasattr(sl_rows.index[-1], 'date') else sl_rows.index[-1])
            if current_close < last_sl:
                bos = {"direction": "BEARISH", "level": round(last_sl, 2),
                       "date": last_sl_date, "label": "BOS — broke below swing low"}
        # CHoCH: close above most recent swing high
        if not sh_rows.empty:
            last_sh = float(sh_rows["swing_high"].iloc[-1])
            last_sh_date = str(sh_rows.index[-1].date() if hasattr(sh_rows.index[-1], 'date') else sh_rows.index[-1])
            if current_close > last_sh:
                choch = {"direction": "BULLISH", "level": round(last_sh, 2),
                         "date": last_sh_date, "label": "CHoCH — broke above swing high (structure flip)"}

    return bos, choch


# ── Single Timeframe Analysis ─────────────────────────────────────────────────

def analyze_timeframe(df: pd.DataFrame, label: str, swing_n: int = 3) -> Dict:
    """Full Gen1 PA analysis for a single timeframe DataFrame."""
    if df is None or len(df) < (swing_n * 2 + 5):
        return {"label": label, "error": "Insufficient data", "structure": "UNKNOWN"}

    df_s = detect_swings(df, n=swing_n)
    result = classify_structure(df_s)

    # Key price levels
    current = float(df["Close"].iloc[-1])
    prev_high = float(df["High"].iloc[-2]) if len(df) >= 2 else None
    prev_low  = float(df["Low"].iloc[-2])  if len(df) >= 2 else None
    prev_close = float(df["Close"].iloc[-2]) if len(df) >= 2 else None

    # Most recent 3 candles
    recent = []
    for idx, row in df.tail(3).iterrows():
        recent.append({
            "date":      str(idx.date() if hasattr(idx, 'date') else idx),
            "open":      round(float(row["Open"]), 2),
            "high":      round(float(row["High"]), 2),
            "low":       round(float(row["Low"]), 2),
            "close":     round(float(row["Close"]), 2),
            "direction": "UP" if row["Close"] >= row["Open"] else "DOWN",
        })

    # Nearest swing levels above/below price
    sh_above = _nearest_swing_above(df_s, current)
    sl_below = _nearest_swing_below(df_s, current)

    result.update({
        "label":        label,
        "current":      round(current, 2),
        "prev_high":    round(prev_high, 2) if prev_high else None,
        "prev_low":     round(prev_low,  2) if prev_low  else None,
        "prev_close":   round(prev_close, 2) if prev_close else None,
        "resistance":   sh_above,
        "support":      sl_below,
        "recent_candles": recent,
        "bar_count":    len(df),
    })
    return result


def _nearest_swing_above(df_s: pd.DataFrame, price: float) -> Optional[float]:
    sh = df_s[df_s["swing_high"].notna()]["swing_high"]
    above = sh[sh > price]
    return round(float(above.min()), 2) if not above.empty else None


def _nearest_swing_below(df_s: pd.DataFrame, price: float) -> Optional[float]:
    sl = df_s[df_s["swing_low"].notna()]["swing_low"]
    below = sl[sl < price]
    return round(float(below.max()), 2) if not below.empty else None


# ── Data Fetching ─────────────────────────────────────────────────────────────

def _fetch(ticker: str, interval: str, period: str) -> Optional[pd.DataFrame]:
    try:
        df = yf.download(ticker, period=period, interval=interval,
                         progress=False, auto_adjust=True)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        return df if not df.empty else None
    except Exception:
        return None


def _resample_to_4h(df_1h: pd.DataFrame) -> Optional[pd.DataFrame]:
    """Resample 1H bars to 4H."""
    try:
        df = df_1h.resample("4h").agg({
            "Open":   "first",
            "High":   "max",
            "Low":    "min",
            "Close":  "last",
            "Volume": "sum",
        }).dropna()
        return df if not df.empty else None
    except Exception:
        return None


# ── Multi-Timeframe Analysis ──────────────────────────────────────────────────

# Timeframe weights for bias scoring (higher TF = more weight)
_TF_WEIGHTS = {"Daily": 4, "4H": 3, "1H": 2, "15m": 1}
_STRUCTURE_SCORE = {"BULLISH": 1, "BEARISH": -1, "RANGING": 0, "UNKNOWN": 0}


def get_multi_tf_analysis(ticker: str = "NQ=F") -> Dict:
    """
    Fetch and analyse NQ (or any ticker) across Daily, 4H, 1H, 15m.
    Returns per-TF structure + a weighted multi-TF bias.
    """
    # Fetch data
    daily  = _fetch(ticker, "1d",  "6mo")
    hourly = _fetch(ticker, "1h",  "30d")
    m15    = _fetch(ticker, "15m", "5d")

    tf_results = {}

    if daily is not None:
        tf_results["Daily"] = analyze_timeframe(daily,  "Daily", swing_n=3)

    if hourly is not None:
        h4 = _resample_to_4h(hourly)
        if h4 is not None and len(h4) >= 10:
            tf_results["4H"] = analyze_timeframe(h4, "4H", swing_n=3)
        tf_results["1H"] = analyze_timeframe(hourly, "1H", swing_n=3)

    if m15 is not None:
        tf_results["15m"] = analyze_timeframe(m15, "15m", swing_n=3)

    # Weighted bias score
    total_weight = 0
    total_score  = 0
    tf_summary   = []

    for tf_label, tf_weight in _TF_WEIGHTS.items():
        if tf_label not in tf_results:
            continue
        r = tf_results[tf_label]
        struct = r.get("structure", "UNKNOWN")
        score  = _STRUCTURE_SCORE[struct] * tf_weight
        total_score  += score
        total_weight += tf_weight
        tf_summary.append(f"{tf_label}: {struct}")

    max_score = total_weight  # all bullish
    pct = (total_score / max_score * 100) if max_score else 0

    if pct >= 50:
        bias = "BULLISH"
    elif pct <= -50:
        bias = "BEARISH"
    elif pct >= 20:
        bias = "LEANING BULLISH"
    elif pct <= -20:
        bias = "LEANING BEARISH"
    else:
        bias = "RANGING / NEUTRAL"

    # Alignment note
    structures = [tf_results[tf].get("structure") for tf in ["Daily", "4H", "1H", "15m"] if tf in tf_results]
    bullish_count = structures.count("BULLISH")
    bearish_count = structures.count("BEARISH")

    if bullish_count == len(structures):
        alignment = "FULL ALIGNMENT — all timeframes bullish"
    elif bearish_count == len(structures):
        alignment = "FULL ALIGNMENT — all timeframes bearish"
    elif bullish_count > bearish_count:
        alignment = f"PARTIAL ALIGNMENT — {bullish_count}/{len(structures)} TFs bullish"
    elif bearish_count > bullish_count:
        alignment = f"PARTIAL ALIGNMENT — {bearish_count}/{len(structures)} TFs bearish"
    else:
        alignment = "NO ALIGNMENT — mixed structure across timeframes"

    return {
        "ticker":      ticker,
        "bias":        bias,
        "score_pct":   round(pct, 1),
        "alignment":   alignment,
        "tf_summary":  tf_summary,
        "timeframes":  tf_results,
    }


# ── Prompt Formatter ──────────────────────────────────────────────────────────

def format_for_prompt(data: Dict) -> str:
    """Format multi-TF analysis as clean text block for the AI prompt."""
    if not data or data.get("error"):
        return f"  Market structure data unavailable: {data.get('error', 'unknown')}"

    lines = [
        f"  Ticker: {data['ticker']}",
        f"  Multi-TF Bias: {data['bias']} (score: {data['score_pct']}%)",
        f"  Alignment: {data['alignment']}",
        f"  TF Summary: {' | '.join(data.get('tf_summary', []))}",
        "",
    ]

    for tf_label in ["Daily", "4H", "1H", "15m"]:
        tf = data["timeframes"].get(tf_label)
        if not tf or tf.get("error"):
            continue

        struct = tf.get("structure", "?")
        bos    = tf.get("bos")
        choch  = tf.get("choch")
        res    = tf.get("resistance")
        sup    = tf.get("support")

        lines.append(f"  [{tf_label}] Structure: {struct}")
        lines.append(f"    Price: {tf.get('current')} | PrevH: {tf.get('prev_high')} | PrevL: {tf.get('prev_low')}")
        if res:
            lines.append(f"    Nearest Resistance (swing high above): {res}")
        if sup:
            lines.append(f"    Nearest Support (swing low below): {sup}")
        if bos:
            lines.append(f"    BOS: {bos['label']} @ {bos['level']} ({bos['date']})")
        if choch:
            lines.append(f"    CHoCH: {choch['label']} @ {choch['level']} ({choch['date']})")

        # Recent candles
        candles = tf.get("recent_candles", [])
        if candles:
            c_str = " > ".join(
                f"{c['date']} {c['direction']}({c['open']}->{c['close']})"
                for c in candles
            )
            lines.append(f"    Recent: {c_str}")
        lines.append("")

    return "\n".join(lines)
