"""
Playbook Matcher — maps current bot bias and market conditions to the
NQ Volume Profile Playbook strategies (R1, R2, MY-R, T1, T2, MY-T).

Decision logic:
  RANGE day  -> R1, R2, MY-R  (fade value area edges)
  TREND day  -> T1, T2, MY-T  (trade with the trend)

The day-type classifier uses NQ trend, multi-TF alignment, AI bias, and VIX.
"""

from typing import Dict, List, Optional, Tuple


# ── Strategy catalogue ────────────────────────────────────────────────────────

STRATEGIES: Dict[str, Dict] = {
    "R1": {
        "name":        "Value Area Edge Fade",
        "type":        "RANGE",
        "win_rate":    "60-70%",
        "rr":          "1:1 – 1:1.5",
        "stop":        "10-15 pts",
        "setup":       "Price pushes into VAL or VAH; wait for delta flip / absorption",
        "bull_entry":  "Buy at VAL -> target POC -> VAH",
        "bear_entry":  "Sell at VAH -> target POC -> VAL",
        "kill_switch": "15+ min of volume building OUTSIDE the edge -> range breaking",
    },
    "R2": {
        "name":        "The 80% Rule",
        "type":        "RANGE",
        "win_rate":    "70-80%",
        "rr":          "1:1.5 – 1:3",
        "stop":        "15 pts",
        "setup":       "Open outside yesterday's value; price pulls back in and accepts 15-20 min",
        "bull_entry":  "Buy VAL retest from above — CVD divergence required -> target POC -> VAH",
        "bear_entry":  "Sell VAH retest from below — CVD divergence required -> target POC -> VAL",
        "kill_switch": "Price drops back out of value — fake acceptance",
    },
    "MY-R": {
        "name":        "Big Balance Extreme Fade",
        "type":        "RANGE",
        "win_rate":    "Track own data",
        "rr":          "1:2 – 1:4",
        "stop":        "15-25 pts beyond extreme",
        "setup":       "Price reaches composite VAH or VAL of multi-day balance",
        "bull_entry":  "Buy at composite VAL — needs absorption + CVD divergence",
        "bear_entry":  "Sell at composite VAH — needs absorption + CVD divergence",
        "kill_switch": "Price accepts beyond big range edge (15+ min of volume)",
    },
    "T1": {
        "name":        "Break of Value + Retest",
        "type":        "TREND",
        "win_rate":    "50-60%",
        "rr":          "1:2 – 1:3",
        "stop":        "12-20 pts",
        "setup":       "Trend day; price breaks VAH/VAL, then retests the broken level",
        "bull_entry":  "Buy first pullback to broken VAH (now support) — weak pullback + delta flip",
        "bear_entry":  "Sell first rally to broken VAL (now resistance) — weak pullback + delta flip",
        "kill_switch": "Price closes back inside yesterday's value and stays",
    },
    "T2": {
        "name":        "Thin Zone Break (LVN Air Pocket)",
        "type":        "TREND",
        "win_rate":    "45-55%",
        "rr":          "1:2 – 1:4",
        "stop":        "12-20 pts",
        "setup":       "Price at edge of HVN with LVN (thin gap) beyond it",
        "bull_entry":  "Stop-buy just above LVN edge — enter at START of gap, target next HVN",
        "bear_entry":  "Stop-sell just below LVN edge — enter at START of gap, target next HVN",
        "kill_switch": "Price falls back inside the fat zone (HVN) it broke from",
    },
    "MY-T": {
        "name":        "Medium Range Acceptance Break",
        "type":        "TREND",
        "win_rate":    "Track own data",
        "rr":          "1:2 – 1:3",
        "stop":        "12-18 pts below range POC",
        "setup":       "30-60 min medium range (20-40 NQ pts) builds, clear POC forms",
        "bull_entry":  "Buy break above range VAH or first micro-pullback to broken VAH",
        "bear_entry":  "Sell break below range VAL or first micro-pullback to broken VAL",
        "kill_switch": "Breakout closes back inside medium range -> trapped breakout",
    },
}


# ── Day-type classifier ───────────────────────────────────────────────────────

def _classify_day_type(
    bias_nq: str,
    nq: Dict,
    price_action: Optional[Dict],
    macro: Optional[Dict],
) -> Dict:
    """
    Score current conditions as RANGE vs TREND.

    Scoring:
      Each signal adds ±1-2.  Positive -> TREND, Negative -> RANGE.
      |score| >= 2 = HIGH confidence; |score| == 1 = MEDIUM; 0 = LOW.
    """
    score = 0
    reasons: List[str] = []

    # 1. NQ daily trend
    trend = (nq or {}).get("trend", "SIDEWAYS")
    if trend == "SIDEWAYS":
        score -= 2
        reasons.append("NQ trend SIDEWAYS -> range conditions")
    elif trend in ("UP", "DOWN"):
        score += 2
        reasons.append(f"NQ trend {trend} -> directional momentum")

    # 2. Multi-TF alignment score from price_action
    if price_action and not price_action.get("error"):
        try:
            score_pct = float(price_action.get("score_pct", 0))
        except (TypeError, ValueError):
            score_pct = 0.0

        if abs(score_pct) >= 50:
            score += 2
            reasons.append(f"Strong TF alignment ({score_pct:+.0f}%) -> trend day")
        elif abs(score_pct) <= 20:
            score -= 1
            reasons.append(f"Weak TF alignment ({score_pct:+.0f}%) -> range day")

        # Daily structure
        daily_struct = (
            (price_action.get("timeframes") or {})
            .get("Daily", {})
            .get("structure", "RANGING")
        )
        if daily_struct == "RANGING":
            score -= 1
            reasons.append("Daily structure RANGING")
        elif daily_struct in ("BULLISH", "BEARISH"):
            score += 1
            reasons.append(f"Daily structure {daily_struct}")

    # 3. AI bias
    if bias_nq == "NEUTRAL":
        score -= 1
        reasons.append("AI bias NEUTRAL -> mixed signals")
    else:
        score += 1
        reasons.append(f"AI bias {bias_nq}")

    # 4. VIX (elevated VIX = volatile/trend conditions)
    if macro:
        vix = macro.get("VIX (Fear Index)", {})
        if not vix.get("error"):
            try:
                vix_chg = float(vix.get("day_chg", 0))
                vix_val = float(vix.get("price", 0) or 0)
            except (TypeError, ValueError):
                vix_chg, vix_val = 0.0, 0.0
            if vix_val > 22 or abs(vix_chg) > 4:
                score += 1
                reasons.append(f"VIX elevated ({vix_val:.1f}) -> trending/volatile")
            elif vix_val < 15 and abs(vix_chg) < 2:
                score -= 1
                reasons.append(f"VIX low ({vix_val:.1f}) -> calm/range environment")

    # Classify
    if score >= 2:
        day_type = "TREND"
        confidence = "HIGH" if score >= 4 else "MEDIUM"
    elif score <= -2:
        day_type = "RANGE"
        confidence = "HIGH" if score <= -4 else "MEDIUM"
    elif score == 1:
        day_type = "TREND"
        confidence = "LOW"
    elif score == -1:
        day_type = "RANGE"
        confidence = "LOW"
    else:
        day_type = "RANGE"
        confidence = "LOW"
        reasons.append("Score = 0 — defaulting to RANGE (safer bias)")

    return {
        "day_type":   day_type,
        "confidence": confidence,
        "score":      score,
        "reasons":    reasons,
    }


# ── Strategy selector ─────────────────────────────────────────────────────────

def _opened_outside_value(nq: Dict) -> bool:
    """Rough proxy: is current price well outside yesterday's high/low range?"""
    try:
        curr = float(nq.get("current_price") or 0)
        ph   = float(nq.get("prev_day_high")  or 0)
        pl   = float(nq.get("prev_day_low")   or 0)
        if curr and ph and pl and ph > pl:
            rng = ph - pl
            return curr > ph + rng * 0.05 or curr < pl - rng * 0.05
    except (TypeError, ValueError):
        pass
    return False


def _build_strategy(
    key: str,
    bias_nq: str,
    note: str,
    condition_met: bool = True,
) -> Dict:
    s = STRATEGIES[key].copy()
    is_bull = bias_nq == "BULLISH"
    is_bear = bias_nq == "BEARISH"
    s["key"]       = key
    s["direction"] = "BUY" if is_bull else "SELL" if is_bear else "BOTH"
    s["entry"]     = s["bull_entry"] if is_bull else s["bear_entry"] if is_bear else "Buy VAL / Sell VAH"
    s["note"]      = note
    s["condition_met"] = condition_met
    return s


def _get_active_strategies(
    day_type: str,
    bias_nq: str,
    nq: Dict,
) -> List[Dict]:
    outside = _opened_outside_value(nq)

    if day_type == "RANGE":
        return [
            _build_strategy(
                "R1", bias_nq,
                "Primary range setup — fade the value area edges with delta confirmation",
            ),
            _build_strategy(
                "R2", bias_nq,
                (
                    "80% Rule — opened OUTSIDE yesterday's value, re-acceptance in progress"
                    if outside
                    else "80% Rule — monitor: only valid if today opened outside yesterday's value"
                ),
                condition_met=outside,
            ),
            _build_strategy(
                "MY-R", bias_nq,
                "Highest R:R — only at multi-day composite VAH/VAL extremes with two confirmations",
            ),
        ]
    else:  # TREND
        return [
            _build_strategy(
                "T1", bias_nq,
                "Wait for the retest — NEVER chase the initial breakout",
            ),
            _build_strategy(
                "T2", bias_nq,
                "Enter at START of LVN gap only — stacked buy/sell imbalances required",
            ),
            _build_strategy(
                "MY-T", bias_nq,
                "Wait 30-60 min for a medium range to build and accept (clear POC must form)",
            ),
        ]


# ── Public API ────────────────────────────────────────────────────────────────

def get_playbook_match(
    bias_nq: str,
    side: str,
    nq: Dict,
    price_action: Optional[Dict],
    macro: Optional[Dict],
) -> Dict:
    """
    Main entry point.

    Returns a dict with:
      day_type          — "RANGE" | "TREND"
      day_confidence    — "HIGH" | "MEDIUM" | "LOW"
      day_score         — numeric score (positive = trend signals)
      day_reasons       — list of strings explaining the classification
      bias              — bias_nq passed in
      side              — side passed in
      active_strategies — list of strategy dicts with directional guidance
      off_strategies    — list of strategy keys that are OFF today
      key_levels        — list of key price levels from bot data
      risk_note         — risk management reminder for this day type
    """
    day_info   = _classify_day_type(bias_nq, nq, price_action, macro)
    day_type   = day_info["day_type"]
    strategies = _get_active_strategies(day_type, bias_nq, nq)

    # Key levels from price action
    key_levels: List[str] = []
    if price_action and not price_action.get("error"):
        tfs = price_action.get("timeframes") or {}
        for tf_label in ("Daily", "4H", "1H"):
            tf = tfs.get(tf_label) or {}
            if tf.get("error"):
                continue
            r = tf.get("resistance")
            s = tf.get("support")
            if r:
                key_levels.append(f"{tf_label} Resistance: {r}")
            if s:
                key_levels.append(f"{tf_label} Support: {s}")

    for key, label in [
        ("prev_day_high", "Prev Day High"),
        ("prev_day_low",  "Prev Day Low"),
        ("week_high",     "Week High"),
        ("week_low",      "Week Low"),
    ]:
        val = (nq or {}).get(key)
        if val and val != "?":
            key_levels.append(f"{label}: {val}")

    risk_note = (
        "RANGE RULES: Kill switch = 15+ min of volume outside value edge. "
        "Stop 10-25 pts. Trade 9:30–11:30 ET. 3 losers -> quit for the day."
        if day_type == "RANGE"
        else
        "TREND RULES: Never fade the trend. Only trade retests/pullbacks. "
        "Stop 12-20 pts. 3 losers -> quit for the day."
    )

    off = ["T1", "T2", "MY-T"] if day_type == "RANGE" else ["R1", "R2", "MY-R"]

    return {
        "day_type":          day_type,
        "day_confidence":    day_info["confidence"],
        "day_score":         day_info["score"],
        "day_reasons":       day_info["reasons"],
        "bias":              bias_nq,
        "side":              side,
        "active_strategies": strategies,
        "off_strategies":    off,
        "key_levels":        key_levels[:8],  # cap to 8 most relevant
        "risk_note":         risk_note,
    }
