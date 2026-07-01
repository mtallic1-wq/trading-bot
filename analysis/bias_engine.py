"""
Uses Groq (LLaMA 3.3 70B) to synthesize news + macro data into a clear NYSE session prediction.
Approach: NEWS-FIRST. Chart data is only supporting context.
NQ (Nasdaq-100 futures) focused.
"""

import time
from typing import Dict, Optional
from config import GROQ_API_KEY, GROQ_MODEL, GEMINI_API_KEY
from analysis.price_action import format_for_prompt as format_pa
from scrapers.tradingview_live import format_for_prompt as format_tv_live

SYSTEM_PROMPT = """You are a professional futures trader and market analyst specialising in NQ (Nasdaq-100 futures).
Your job is to analyse market structure across multiple timeframes combined with macro and news data
to determine whether the NYSE session will be predominantly BULLISH (buy side) or BEARISH (sell side) for NQ.

Your analysis uses two equally weighted pillars:

PILLAR 1 — MULTI-TIMEFRAME PRICE STRUCTURE (Gen1 Price Action):
- Read market structure top-down: Daily → 4H → 1H → 15m
- Identify the dominant trend on each timeframe using swing highs and swing lows (HH/HL = bullish, LH/LL = bearish)
- Note any Break of Structure (BOS) — price breaking above/below a swing high/low, confirming trend continuation
- Note any Change of Character (CHoCH) — price breaking the opposite structure point, signalling a potential reversal
- Higher timeframe structure overrides lower timeframe structure
- Full TF alignment (all 4 TFs same direction) = high confidence bias
- Conflicting TFs = lower confidence or neutral

PILLAR 2 — MACRO & NEWS:
- Major headlines and their implications for tech/growth equities
- Macroeconomic indicators: DXY (inverse NQ), VIX (fear), yields (inverse NQ), Gold, Oil
- Economic calendar: actual vs forecast results
- Overall news sentiment

PILLAR 3 — TRADER'S CHART KEY LEVELS (TradingView Desktop):
- Supply/demand zones the trader has manually drawn as rectangles (these are the trader's own key areas)
- Named horizontal levels (e.g., "VAH+low volume", previous highs/lows)
- Trend line directions drawn on the chart
- The trader's own long/short position markers (show where they see entries/targets)
- Price being INSIDE a drawn zone = high significance

COMBINING ALL THREE PILLARS:
- When structure AND macro/news AND chart levels all agree → HIGH confidence bias
- When structure is bullish but news is bearish → reduce confidence, note the conflict
- When price is at or near a drawn zone → that level becomes critical context
- When structure is ranging/neutral → let macro/news drive the bias
- Always reference the nearest key levels above and below current price

Output your analysis in this exact format:

---
## MACRO ENVIRONMENT SUMMARY
[3-5 bullet points on what DXY, VIX, yields, Gold, Oil are telling you about the macro backdrop]
[State: RISK-ON or RISK-OFF environment]

## KEY NEWS ANALYSIS
[Go through the most important headlines from Yahoo Finance, World Monitor, and TradingView]
[For each major story, explain what it means for NQ specifically]
[State overall news sentiment: BULLISH / BEARISH / MIXED for Nasdaq]

## ECONOMIC EVENTS IMPACT
[If there are economic calendar events, analyse what actual vs forecast means for NQ]
[If no events, note that]

## MULTI-TIMEFRAME STRUCTURE
[Analyse each timeframe: Daily, 4H, 1H, 15m]
[For each: state structure (BULLISH/BEARISH/RANGING), note any BOS or CHoCH, nearest resistance/support]
[State overall multi-TF bias and alignment level]
[This is a primary driver alongside macro/news]

## PREDICTION
**NYSE SESSION SIDE: [BUY SIDE / SELL SIDE / NEUTRAL]**

| Instrument | Direction | Confidence | Level |
|------------|-----------|------------|-------|
| NQ (Nasdaq-100) | [BULLISH / BEARISH / NEUTRAL] | [X]% | [HIGH / MEDIUM / LOW] |

**NQ Prediction: [BULLISH / BEARISH / NEUTRAL]**
**Confidence: [X]% — [HIGH/MEDIUM/LOW]**

## TOP REASONS
1. [Most important reason — news/macro based]
2. [Second reason]
3. [Third reason]

## KEY RISKS
- [What could invalidate this prediction]
- [Any conflicting signals]

## WHAT TO WATCH DURING NYSE SESSION
- [Specific news or data releases to watch]
- [Key NQ price levels: previous day high/low, weekly high/low, any key round numbers]
- [Any scheduled events during session hours]

## ONE-LINE SUMMARY
"[DATE] NYSE SESSION: [BUY SIDE/SELL SIDE/NEUTRAL] — [core reason in one sentence]"
---

IMPORTANT RULES:
- Your prediction must be primarily justified by NEWS and MACRO, not chart patterns
- If news is clearly bearish (bad economic data, geopolitical risk, rate fears), say SELL SIDE
- If news is clearly bullish (strong earnings, rate cut hopes, good data), say BUY SIDE
- If news is mixed or unclear, say NEUTRAL with LOW confidence
- DXY strongly up = headwind for NQ (tech/growth inversely correlated with USD strength)
- VIX above 20 and rising = fear/risk-off = bearish for NQ
- Yields rising sharply = pressure on tech/growth (NQ bearish)
- Be direct and confident — traders need a clear answer"""


def build_prompt(nq: Dict, macro: Dict, yahoo: Dict,
                 worldmonitor: Dict, tradingview: Dict, date_str: str,
                 price_action: Optional[Dict] = None,
                 tv_live: Optional[Dict] = None) -> str:

    # Macro section
    macro_lines = []
    for label, data in macro.items():
        if "error" in data:
            macro_lines.append(f"  {label}: data unavailable")
        else:
            d  = data.get("day_chg", 0)
            d5 = data.get("5d_chg", 0)
            macro_lines.append(
                f"  {label}: {data['price']} | Day: {d:+.3f}% | 5-Day: {d5:+.2f}%"
            )

    # NQ summary
    def inst_summary(inst: Dict) -> str:
        if inst.get("error"):
            return f"  Error: {inst['error']}"
        perf = inst.get("performance", {})
        candles = inst.get("recent_candles", [])
        c_str = " | ".join(
            f"{c['date']} {c['direction']} (O:{c['open']} H:{c['high']} L:{c['low']} C:{c['close']})"
            for c in candles
        )
        return (
            f"  Price: {inst.get('current_price','?')} | Trend: {inst.get('trend','?')}\n"
            f"  1D: {perf.get('1d_pct','?')}% | 5D: {perf.get('5d_pct','?')}% | 10D: {perf.get('10d_pct','?')}%\n"
            f"  Prev High: {inst.get('prev_day_high','?')} | Prev Low: {inst.get('prev_day_low','?')} | Prev Close: {inst.get('prev_day_close','?')}\n"
            f"  Week High: {inst.get('week_high','?')} | Week Low: {inst.get('week_low','?')}\n"
            f"  Last 5 Candles: {c_str}"
        )

    # Yahoo news
    yahoo_lines = "\n".join(
        f"  {i+1}. {n['title']}"
        for i, n in enumerate(yahoo.get("items", [])[:20])
    ) or "  None available"

    # World Monitor
    wm_rows = worldmonitor.get("rows", [])[:20]
    wm_text = "\n".join(
        f"  {r['label']} {' '.join(r['values'])}" for r in wm_rows
    )
    if not wm_text:
        wm_text = worldmonitor.get("raw_snippet", "No data")[:2500]

    # TradingView news
    tv_news = tradingview.get("news", [])[:15]
    tv_lines = "\n".join(
        f"  {i+1}. {n['title']}"
        for i, n in enumerate(tv_news)
    ) or "  None available"

    # Economic calendar
    cal = tradingview.get("economic_calendar", [])
    cal_lines = "\n".join(
        f"  [{e.get('impact','?')}] {e['title']} — Actual: {e.get('actual','-')} | Forecast: {e.get('forecast','-')} | Prev: {e.get('previous','-')}"
        for e in cal if e.get("title")
    ) or "  No scheduled events"

    # Multi-timeframe price action structure
    pa_text = format_pa(price_action) if price_action else "  Price action data unavailable"

    # Live TradingView chart key levels
    tv_live_text = format_tv_live(tv_live) if tv_live else "  TradingView Desktop not connected"

    return f"""ANALYSIS DATE: {date_str}
TARGET: NYSE Session (09:30–16:00 ET) — NQ Nasdaq-100 Futures

=== MACROECONOMIC INDICATORS ===
{chr(10).join(macro_lines)}

=== NQ — Nasdaq-100 Futures ===
{inst_summary(nq)}

=== YAHOO FINANCE — Headlines (https://finance.yahoo.com) ===
{yahoo_lines}

=== WORLD MONITOR — Global Markets (https://www.worldmonitor.app) ===
{wm_text}

=== TRADINGVIEW — Market News (https://www.tradingview.com) ===
{tv_lines}

=== ECONOMIC CALENDAR — {date_str} ===
{cal_lines}

=== MULTI-TIMEFRAME PRICE STRUCTURE (Gen1 Price Action) ===
{pa_text}

=== TRADER'S CHART — LIVE KEY LEVELS (TradingView Desktop) ===
{tv_live_text}

Based on ALL the above — news, macro, multi-TF structure, and the trader's own drawn key levels — give your complete analysis and NYSE session prediction for NQ on {date_str}.
"""


def _call_gemini(prompt: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        return None
    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{
                "text": f"{SYSTEM_PROMPT}\n\n[USER INPUT]:\n{prompt}"
            }]
        }],
        "generationConfig": {
            "temperature": 0.0
        }
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            res_json = response.json()
            return res_json["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"[Gemini Failover Error] status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Gemini Failover Error] failed: {e}")
    return None


def get_bias(nq: Dict, macro: Dict, yahoo: Dict,
             worldmonitor: Dict, tradingview: Dict, date_str: str,
             price_action: Optional[Dict] = None,
             tv_live: Optional[Dict] = None) -> Dict:

    prompt = build_prompt(nq, macro, yahoo, worldmonitor, tradingview, date_str,
                          price_action=price_action, tv_live=tv_live)

    # 1. Try Groq (Llama 3.3 70B) first
    if GROQ_API_KEY:
        for attempt in range(3):
            try:
                from groq import Groq, RateLimitError
                client = Groq(api_key=GROQ_API_KEY)
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    max_tokens=2500,
                    temperature=0.0,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                )
                text = response.choices[0].message.content
                bias_nq, side = _parse_bias(text)
                return {
                    "analysis": text,
                    "bias_nq":  bias_nq,
                    "side":     side,
                    "source":   f"Groq ({GROQ_MODEL}) — News/Macro Analysis",
                }
            except Exception as e:
                err_str = str(e)
                print(f"[Groq Error] attempt {attempt+1} failed: {e}")
                if "rate" in err_str.lower() and attempt < 2:
                    wait = 2 ** attempt
                    time.sleep(wait)
                    continue
                break

    # 2. Try Gemini 1.5 Flash as dynamic API failover
    if GEMINI_API_KEY:
        try:
            print("[Failover] Attempting Gemini 1.5 Flash api failover...")
            text = _call_gemini(prompt)
            if text:
                bias_nq, side = _parse_bias(text)
                return {
                    "analysis": text,
                    "bias_nq":  bias_nq,
                    "side":     side,
                    "source":   "Gemini (1.5-flash) — Failover Analysis",
                }
        except Exception as e:
            print(f"[Gemini Failover Error] failed: {e}")

    # 3. Simple rule fallback if both APIs fail/are not set
    fb = _simple_fallback(nq, macro, yahoo)
    return {
        "analysis": (
            "LLM API synthesis unavailable — using simple rule-based fallback.\n\n" + fb
        ),
        "bias_nq":  _rule_bias(nq, macro),
        "side":     _rule_side(nq, macro),
        "source":   "Rule-based (fallback)",
    }


# ── Simple rule-based fallback ────────────────────────────────────────────────

def _rule_bias(inst: Dict, macro: Dict) -> str:
    if inst.get("error"):
        return "NEUTRAL"
    trend   = inst.get("trend", "SIDEWAYS")
    vix     = macro.get("VIX (Fear Index)", {})
    dxy     = macro.get("DXY (Dollar Index)", {})
    vix_chg = vix.get("day_chg", 0) if "error" not in vix else 0
    vix_val = vix.get("price", 0)   if "error" not in vix else 0
    dxy_chg = dxy.get("day_chg", 0) if "error" not in dxy else 0

    score = 0
    if trend == "UP":   score += 2
    if trend == "DOWN": score -= 2
    if dxy_chg > 0.3:   score -= 1
    if dxy_chg < -0.3:  score += 1
    if vix_chg > 3:     score -= 2
    if vix_chg < -3:    score += 1
    try:
        if float(vix_val) > 20: score -= 1
    except (TypeError, ValueError):
        pass

    if score >= 2:  return "BULLISH"
    if score <= -2: return "BEARISH"
    return "NEUTRAL"


def _rule_side(nq: Dict, macro: Dict) -> str:
    b = _rule_bias(nq, macro)
    if b == "BULLISH": return "BUY SIDE"
    if b == "BEARISH": return "SELL SIDE"
    return "NEUTRAL"


def _simple_fallback(nq: Dict, macro: Dict, yahoo: Dict) -> str:
    dxy  = macro.get("DXY (Dollar Index)", {})
    vix  = macro.get("VIX (Fear Index)", {})
    tnx  = macro.get("10Y Treasury Yield", {})
    gold = macro.get("Gold", {})
    oil  = macro.get("Crude Oil", {})

    dxy_chg = dxy.get("day_chg", 0) if "error" not in dxy else 0
    vix_chg = vix.get("day_chg", 0) if "error" not in vix else 0
    vix_val = vix.get("price", 0)   if "error" not in vix else 0

    try:
        vix_float = float(vix_val)
    except (TypeError, ValueError):
        vix_float = 0

    risk_env = (
        "RISK-OFF" if (dxy_chg > 0.3 and vix_chg > 2) or vix_float > 22
        else "RISK-ON" if (dxy_chg < -0.2 and vix_chg < -2)
        else "MIXED"
    )

    b_nq  = _rule_bias(nq, macro)
    side  = _rule_side(nq, macro)

    news_sample = "\n".join(
        f"  - {n['title']}" for n in yahoo.get("items", [])[:8]
    ) or "  No headlines fetched"

    def m(d):
        return f"{d.get('price','?')} (day {d.get('day_chg',0):+.2f}%)" if "error" not in d else "N/A"

    return "\n".join([
        "## Macro Environment",
        f"- DXY: {m(dxy)} {'(USD strong — headwind for NQ)' if dxy_chg > 0.3 else '(USD weak — tailwind for NQ)' if dxy_chg < -0.3 else ''}",
        f"- VIX: {m(vix)} {'(Fear HIGH — risk-off)' if vix_float > 20 else '(Fear low — risk-on)'}",
        f"- 10Y Yield: {m(tnx)} {'(Yields up — pressure on NQ/tech)' if tnx.get('day_chg',0) > 2 else ''}",
        f"- Gold: {m(gold)}",
        f"- Oil: {m(oil)}",
        f"- Environment: **{risk_env}**",
        "",
        "## Recent Headlines (Yahoo Finance)",
        news_sample,
        "",
        "## NQ Market Context",
        f"- NQ: {nq.get('trend','?')} | Price: {nq.get('current_price','?')} | 1D: {nq.get('performance',{}).get('1d_pct','?')}% | 5D: {nq.get('performance',{}).get('5d_pct','?')}%",
        "",
        "---",
        "## NYSE SESSION PREDICTION",
        f"**SIDE: {side}**",
        f"**NQ: {b_nq}**",
    ])


def _parse_bias(text: str):
    t = text.upper()

    side = "NEUTRAL"
    if "BUY SIDE" in t:    side = "BUY SIDE"
    elif "SELL SIDE" in t: side = "SELL SIDE"

    bias_nq = "NEUTRAL"
    for line in text.split("\n"):
        lu = line.upper()
        if "NQ PREDICTION" in lu or ("NQ:" in lu and len(line) < 80):
            if "BULLISH" in lu:   bias_nq = "BULLISH"
            elif "BEARISH" in lu: bias_nq = "BEARISH"

    # Fallback from side
    if bias_nq == "NEUTRAL" and side == "BUY SIDE":  bias_nq = "BULLISH"
    if bias_nq == "NEUTRAL" and side == "SELL SIDE": bias_nq = "BEARISH"

    return bias_nq, side
