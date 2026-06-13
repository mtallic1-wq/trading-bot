"""
Fetches basic price and trend data for NQ and ES.
Only used as supporting context — not the primary analysis.
No ICT/SMC terminology. Just: price, trend direction, key levels.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional
from config import (
    NQ_TICKER, DXY_TICKER,
    VIX_TICKER, TNX_TICKER, GC_TICKER, CL_TICKER,
)


def _download(ticker: str, interval: str, end_date: Optional[str], lookback_days: int) -> pd.DataFrame:
    """Download OHLCV data. Supports historical end_date."""
    try:
        if end_date:
            end_dt   = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            start_dt = end_dt - timedelta(days=lookback_days)
            df = yf.download(
                ticker,
                start=start_dt.strftime("%Y-%m-%d"),
                end=end_dt.strftime("%Y-%m-%d"),
                interval=interval,
                progress=False,
                auto_adjust=True,
            )
        else:
            periods = {"1d": "3mo", "1h": "20d"}
            df = yf.download(
                ticker,
                period=periods.get(interval, "3mo"),
                interval=interval,
                progress=False,
                auto_adjust=True,
            )
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        return df
    except Exception:
        return pd.DataFrame()


def _simple_trend(daily: pd.DataFrame) -> str:
    """Return UP / DOWN / SIDEWAYS based on recent closes."""
    if len(daily) < 10:
        return "SIDEWAYS"
    closes = daily["Close"].tail(10).values
    # Linear regression slope direction
    n = len(closes)
    x_mean = (n - 1) / 2
    slope = sum((i - x_mean) * (closes[i] - closes.mean()) for i in range(n))
    # Normalize by price range
    pct = slope / closes.mean() * 100
    if pct > 0.5:
        return "UP"
    if pct < -0.5:
        return "DOWN"
    return "SIDEWAYS"


def _recent_performance(daily: pd.DataFrame) -> Dict:
    """Return % change over last 1, 5, 10 trading days."""
    out = {}
    if len(daily) < 2:
        return out
    cur = float(daily["Close"].iloc[-1])
    def pct(n):
        if len(daily) <= n:
            return None
        ref = float(daily["Close"].iloc[-n-1])
        return round((cur - ref) / ref * 100, 2) if ref else None
    out["1d_pct"]  = pct(1)
    out["5d_pct"]  = pct(5)
    out["10d_pct"] = pct(10)
    return out


def get_instrument_data(ticker: str, name: str, end_date: Optional[str] = None) -> Dict:
    """Fetch price + basic trend for one instrument."""
    result = {"name": name, "ticker": ticker}
    try:
        daily = _download(ticker, "1d", end_date, lookback_days=60)
        if daily.empty or len(daily) < 3:
            result["error"] = "No data returned"
            return result

        cur = float(daily["Close"].iloc[-1])
        pdh = float(daily["High"].iloc[-2])
        pdl = float(daily["Low"].iloc[-2])
        pdc = float(daily["Close"].iloc[-2])
        wkh = float(daily["High"].tail(6).iloc[:-1].max())
        wkl = float(daily["Low"].tail(6).iloc[:-1].min())

        trend = _simple_trend(daily)
        perf  = _recent_performance(daily)

        # Last 5 candles
        last5 = daily.tail(5)[["Open", "High", "Low", "Close"]].copy()
        candles = [
            {
                "date":  str(idx.date()),
                "open":  round(float(r["Open"]),  2),
                "high":  round(float(r["High"]),  2),
                "low":   round(float(r["Low"]),   2),
                "close": round(float(r["Close"]), 2),
                "direction": "UP" if r["Close"] >= r["Open"] else "DOWN",
            }
            for idx, r in last5.iterrows()
        ]

        result.update({
            "current_price": round(cur, 2),
            "prev_day_high": round(pdh, 2),
            "prev_day_low":  round(pdl, 2),
            "prev_day_close": round(pdc, 2),
            "week_high":     round(wkh, 2),
            "week_low":      round(wkl, 2),
            "trend":         trend,
            "performance":   perf,
            "recent_candles": candles,
        })
    except Exception as e:
        result["error"] = str(e)
    return result


def get_macro_data(end_date: Optional[str] = None) -> Dict:
    """Fetch DXY, VIX, 10Y yields, Gold, Oil as macro context."""
    instruments = {
        "DXY (Dollar Index)":    DXY_TICKER,
        "VIX (Fear Index)":      VIX_TICKER,
        "10Y Treasury Yield":    TNX_TICKER,
        "Gold":                  GC_TICKER,
        "Crude Oil":             CL_TICKER,
    }
    ctx = {}
    for label, ticker in instruments.items():
        try:
            df = _download(ticker, "1d", end_date, lookback_days=15)
            if df.empty:
                ctx[label] = {"error": "No data"}
                continue
            cur  = float(df["Close"].iloc[-1])
            prev = float(df["Close"].iloc[-2]) if len(df) >= 2 else cur
            chg  = round((cur - prev) / prev * 100, 3) if prev else 0
            # 5-day performance
            ref5 = float(df["Close"].iloc[-6]) if len(df) >= 6 else cur
            chg5 = round((cur - ref5) / ref5 * 100, 2) if ref5 else 0
            ctx[label] = {
                "price":    round(cur, 3),
                "day_chg":  chg,
                "5d_chg":   chg5,
            }
        except Exception as e:
            ctx[label] = {"error": str(e)}
    return ctx
