"""
TradingView Desktop Live Data — via tradingview-mcp-jackson CLI
---------------------------------------------------------------
Pulls real-time data that only TradingView Desktop can provide:
  1. Real-time NQ quote (live CME price, not delayed)
  2. Trader-drawn key levels (rectangles = zones, horizontal rays, trend lines, positions)
  3. Current chart state

Falls back gracefully if TradingView is not running.
Uses concurrent fetching to keep latency low.
"""

import subprocess
import json
import time
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

_NODE    = r"C:\Program Files\nodejs\node.exe"
_CLI     = r"C:\Users\PC\tradingview-mcp-jackson\src\cli\index.js"
_CLI_CWD = r"C:\Users\PC\tradingview-mcp-jackson"

# Only fetch drawings within this % of current price
_PRICE_FILTER_PCT = 0.08   # 8% above/below
# Max drawings to fetch per type (concurrency cap)
_MAX_RECTS        = 30
_MAX_POSITIONS    = 20


def _tv(*args, timeout: int = 10) -> dict:
    """Run tv CLI command, return parsed JSON. Never raises."""
    try:
        r = subprocess.run(
            [_NODE, _CLI, *args],
            capture_output=True, text=True,
            timeout=timeout, cwd=_CLI_CWD,
        )
        if r.returncode == 0 and r.stdout.strip():
            return json.loads(r.stdout)
        return {"error": r.stderr.strip() or f"exit {r.returncode}"}
    except subprocess.TimeoutExpired:
        return {"error": "timeout"}
    except Exception as e:
        return {"error": str(e)}


def _fetch_drawing(shape_id: str) -> Optional[dict]:
    """Fetch a single drawing's properties. Returns None on failure."""
    result = _tv("draw", "get", shape_id)
    if result.get("success"):
        return result
    return None


# ── Key Level Parsing ─────────────────────────────────────────────────────────

def _parse_rectangle(props: dict, current_price: float) -> Optional[dict]:
    """Extract price zone from a rectangle drawing."""
    points = props.get("points", [])
    if len(points) < 2:
        return None
    prices = sorted([p["price"] for p in points])
    lo, hi = prices[0], prices[-1]
    # Must have a meaningful range (not a degenerate rect)
    if abs(hi - lo) < 1:
        return None
    # Filter to zones near current price
    zone_mid = (lo + hi) / 2
    if abs(zone_mid - current_price) / current_price > _PRICE_FILTER_PCT:
        return None
    label = props.get("properties", {}).get("text", "").strip()
    color = props.get("properties", {}).get("backgroundColor", "")
    # Infer zone type from color: green/teal = demand, red = supply
    zone_type = "DEMAND" if any(c in color.lower() for c in ["77, 208", "76, 175", "0, 200"]) else \
                "SUPPLY"  if any(c in color.lower() for c in ["244, 67", "233, 30", "255, 0"]) else \
                "ZONE"
    return {
        "type":  zone_type,
        "high":  round(hi, 2),
        "low":   round(lo, 2),
        "label": label or zone_type,
        "dist":  round(abs(zone_mid - current_price), 2),
    }


def _parse_horizontal_ray(props: dict) -> Optional[dict]:
    """Extract key level from a horizontal ray."""
    points = props.get("points", [])
    if not points:
        return None
    price = points[0].get("price")
    if not price:
        return None
    label = props.get("properties", {}).get("text", "").strip()
    return {
        "type":  "KEY_LEVEL",
        "price": round(price, 2),
        "label": label or "Key level",
    }


def _parse_trend_line(props: dict) -> Optional[dict]:
    """Extract trend line direction from two price points."""
    points = props.get("points", [])
    if len(points) < 2:
        return None
    p1, p2 = points[0], points[1]
    if p1["time"] == p2["time"]:
        return None
    direction = "UP" if p2["price"] > p1["price"] else "DOWN"
    label = props.get("properties", {}).get("text", "").strip()
    return {
        "type":      "TREND_LINE",
        "direction": direction,
        "from":      round(p1["price"], 2),
        "to":        round(p2["price"], 2),
        "label":     label or f"Trend ({direction})",
    }


def _parse_position(props: dict, pos_type: str) -> Optional[dict]:
    """Extract entry/target/stop from a long or short position drawing."""
    points = props.get("points", [])
    if not points:
        return None
    prices = sorted([p["price"] for p in points])
    label = props.get("properties", {}).get("text", "").strip()
    return {
        "type":   pos_type,   # LONG_POSITION or SHORT_POSITION
        "prices": [round(p, 2) for p in prices],
        "label":  label or pos_type.replace("_", " ").title(),
    }


# ── Drawing Fetcher ───────────────────────────────────────────────────────────

def _get_key_levels(current_price: float) -> Dict:
    """Fetch and parse all relevant chart drawings concurrently."""
    draw_list = _tv("draw", "list")
    if draw_list.get("error") or not draw_list.get("shapes"):
        return {"error": draw_list.get("error", "No drawings found"), "levels": []}

    shapes = draw_list["shapes"]

    # Filter to useful types, cap per type
    target_types = {
        "horizontal_ray": [],
        "trend_line":     [],
        "rectangle":      [],
        "long_position":  [],
        "short_position": [],
    }
    for s in shapes:
        name = s["name"]
        if name in target_types:
            if name == "rectangle"     and len(target_types[name]) >= _MAX_RECTS:     continue
            if name == "long_position" and len(target_types[name]) >= _MAX_POSITIONS:  continue
            if name == "short_position"and len(target_types[name]) >= _MAX_POSITIONS:  continue
            target_types[name].append(s["id"])

    all_ids = [(sid, stype)
               for stype, ids in target_types.items()
               for sid in ids]

    if not all_ids:
        return {"error": "No relevant drawings", "levels": []}

    # Fetch all concurrently
    results_by_id = {}
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(_fetch_drawing, sid): (sid, stype) for sid, stype in all_ids}
        for future in as_completed(futures):
            sid, stype = futures[future]
            props = future.result()
            if props:
                results_by_id[sid] = (stype, props)

    # Parse into structured levels
    zones    = []
    h_levels = []
    trends   = []
    positions = []

    for sid, (stype, props) in results_by_id.items():
        if stype == "rectangle":
            parsed = _parse_rectangle(props, current_price)
            if parsed:
                zones.append(parsed)
        elif stype == "horizontal_ray":
            parsed = _parse_horizontal_ray(props)
            if parsed:
                h_levels.append(parsed)
        elif stype == "trend_line":
            parsed = _parse_trend_line(props)
            if parsed:
                trends.append(parsed)
        elif stype in ("long_position", "short_position"):
            parsed = _parse_position(props, stype.upper())
            if parsed:
                positions.append(parsed)

    # Sort zones by proximity to current price
    zones.sort(key=lambda x: x["dist"])

    return {
        "zones":      zones,       # supply/demand rectangles
        "h_levels":   h_levels,    # horizontal rays
        "trends":     trends,      # trend lines
        "positions":  positions,   # trader's long/short positions
        "total_drawings": len(shapes),
    }


# ── Main Entry Point ──────────────────────────────────────────────────────────

def get_live_chart_data() -> Dict:
    """
    Pull live data from TradingView Desktop:
      - Real-time NQ quote
      - Chart state
      - Trader-drawn key levels (zones, levels, trends, positions)
    """
    # Quick connection check
    state = _tv("state")
    if state.get("error"):
        return {"available": False, "error": "TradingView Desktop not running."}

    symbol    = state.get("symbol", "?")
    timeframe = state.get("resolution", "?")

    # Real-time quote
    quote = _tv("quote")
    current_price = None
    if not quote.get("error"):
        current_price = quote.get("last") or quote.get("close")

    # Key levels from drawings (requires current price for proximity filter)
    key_levels = {}
    if current_price:
        key_levels = _get_key_levels(current_price)

    return {
        "available":   True,
        "symbol":      symbol,
        "timeframe":   f"{timeframe}m",
        "quote":       quote,
        "key_levels":  key_levels,
    }


# ── Prompt Formatter ──────────────────────────────────────────────────────────

def format_for_prompt(data: Dict) -> str:
    """Format live chart data as clean text block for the AI prompt."""
    if not data.get("available"):
        return f"  TradingView Desktop not connected — {data.get('error', 'unavailable')}"

    lines = []
    q = data.get("quote", {})

    # Live price
    if not q.get("error"):
        chg = ""
        try:
            chg = f" ({((q['last'] - q['open']) / q['open'] * 100):+.2f}% today)"
        except Exception:
            pass
        lines.append(f"  Live NQ Price: {q.get('last')} | O:{q.get('open')} H:{q.get('high')} L:{q.get('low')}{chg}")
        lines.append(f"  Chart: {data['symbol']} | TF: {data['timeframe']}")

    kl = data.get("key_levels", {})
    if kl.get("error"):
        lines.append(f"  Key Levels: {kl['error']}")
    else:
        current = q.get("last", 0)

        # Supply/Demand zones (closest first, split above/below)
        zones = kl.get("zones", [])
        if zones:
            above = [z for z in zones if z["low"] > current]
            below = [z for z in zones if z["high"] < current]
            inside = [z for z in zones if z["low"] <= current <= z["high"]]

            if inside:
                lines.append(f"  ** Price is INSIDE a drawn zone: {inside[0]['label']} ({inside[0]['low']} - {inside[0]['high']}) **")
            if above:
                lines.append("  Supply/Resistance Zones above price:")
                for z in above[:4]:
                    lines.append(f"    {z['type']}: {z['low']} - {z['high']}  [{z['label']}]")
            if below:
                lines.append("  Demand/Support Zones below price:")
                for z in below[:4]:
                    lines.append(f"    {z['type']}: {z['low']} - {z['high']}  [{z['label']}]")

        # Horizontal rays (labeled key levels)
        h_levels = kl.get("h_levels", [])
        if h_levels:
            lines.append("  Named Key Levels:")
            for lv in h_levels:
                side = "above" if lv["price"] > current else "below"
                lines.append(f"    {lv['price']}  ({lv['label']}) — {side}")

        # Trend lines
        trends = kl.get("trends", [])
        if trends:
            up_trends   = [t for t in trends if t["direction"] == "UP"]
            down_trends = [t for t in trends if t["direction"] == "DOWN"]
            if up_trends:
                lines.append(f"  Uptrend lines: {len(up_trends)} ({', '.join(t['label'] for t in up_trends[:3])})")
            if down_trends:
                lines.append(f"  Downtrend lines: {len(down_trends)} ({', '.join(t['label'] for t in down_trends[:3])})")

        # Trader positions
        positions = kl.get("positions", [])
        if positions:
            longs  = [p for p in positions if p["type"] == "LONG_POSITION"]
            shorts = [p for p in positions if p["type"] == "SHORT_POSITION"]
            if longs:
                lvls = " | ".join(str(p["prices"]) for p in longs[:3])
                lines.append(f"  Trader Long Positions ({len(longs)}): {lvls}")
            if shorts:
                lvls = " | ".join(str(p["prices"]) for p in shorts[:3])
                lines.append(f"  Trader Short Positions ({len(shorts)}): {lvls}")

        total = kl.get("total_drawings", 0)
        lines.append(f"  [{total} total drawings on chart]")

    return "\n".join(lines)
