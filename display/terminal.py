"""
Clean terminal display — news and macro focused. NQ only.
"""
from typing import Dict, List
from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.markdown import Markdown
from rich.columns import Columns
from rich import box

console = Console(force_terminal=True, highlight=False)


def _bias_style(bias: str) -> str:
    b = bias.upper()
    if "BULL" in b or "BUY" in b:  return "bold green"
    if "BEAR" in b or "SELL" in b: return "bold red"
    return "bold yellow"


def _side_banner(side: str, bias_nq: str, date_str: str) -> Panel:
    style = _bias_style(side)
    body  = Text(justify="center")
    body.append(f"\n  {side}  \n\n", style=f"{style} on black")
    body.append("  NQ: ", style="white")
    body.append(f"{bias_nq}  \n", style=_bias_style(bias_nq))
    return Panel(body, title=f"[bold white] NYSE PREDICTION — {date_str} [/]",
                 border_style=style.split()[-1], expand=False)


def _macro_table(macro: Dict) -> Table:
    t = Table(title="[bold magenta]Macro Indicators[/]", box=box.SIMPLE_HEAVY, expand=True)
    t.add_column("Indicator",  style="cyan", width=22)
    t.add_column("Price",      justify="right", width=10)
    t.add_column("Day Change", justify="right", width=12)
    t.add_column("5-Day",      justify="right", width=10)
    t.add_column("Signal",     justify="center", width=28)

    signals = {
        "DXY":  lambda d, v: ("USD STRONG -- headwind NQ", "red")    if d > 0.3  else ("USD WEAK -- tailwind NQ", "green") if d < -0.3 else ("USD Neutral", "dim"),
        "VIX":  lambda d, v: ("FEAR HIGH -- risk off",  "red")       if (v and float(v) > 20) or d > 3 else ("Fear Low -- risk on", "green") if d < -3 else ("Fear Neutral", "dim"),
        "10Y":  lambda d, v: ("YIELDS UP -- pressure NQ", "yellow")  if d > 2    else ("Yields Down", "green") if d < -2 else ("Yields Neutral", "dim"),
        "Gold": lambda d, v: ("SAFE HAVEN demand", "yellow")         if d > 0.5  else ("Risk-On mood", "green") if d < -0.5 else ("Neutral", "dim"),
        "Oil":  lambda d, v: ("OIL UP -- inflation risk", "yellow")  if d > 1.5  else ("Oil down", "dim") if d < -1.5 else ("Neutral", "dim"),
    }

    for label, data in macro.items():
        if "error" in data:
            t.add_row(label, "N/A", "-", "-", "[dim]No data[/]")
            continue
        price  = data.get("price", "?")
        dc     = data.get("day_chg", 0)
        d5     = data.get("5d_chg", 0)
        dc_col = "red" if dc > 0 else "green" if dc < 0 else "white"
        d5_col = "red" if d5 > 0 else "green" if d5 < 0 else "white"

        sig_fn  = None
        key_map = {"DXY": "DXY", "VIX": "VIX", "10Y Treasury": "10Y", "Gold": "Gold", "Crude": "Oil"}
        for k, v in key_map.items():
            if k in label:
                sig_fn = signals.get(v)
                break
        sig_txt, sig_col = sig_fn(dc, price) if sig_fn else ("", "white")

        t.add_row(
            label,
            str(price),
            f"[{dc_col}]{dc:+.3f}%[/]",
            f"[{d5_col}]{d5:+.2f}%[/]",
            f"[{sig_col}]{sig_txt}[/]",
        )
    return t


def _price_table(nq: Dict) -> Table:
    t = Table(title="[bold cyan]NQ -- Nasdaq-100 Futures[/]", box=box.SIMPLE_HEAVY, expand=True)
    t.add_column("", style="cyan bold", width=20)
    t.add_column("Value", justify="right")

    def v(key): return str(nq.get(key, "?"))
    def p(k1, k2): return str(nq.get(k1, {}).get(k2, "?"))
    def tc(trend):
        if trend == "UP":   return "[green]UP[/]"
        if trend == "DOWN": return "[red]DOWN[/]"
        return "[yellow]SIDEWAYS[/]"

    rows = [
        ("Current Price",  v("current_price")),
        ("Trend",          tc(nq.get("trend", "?"))),
        ("1-Day Change",   p("performance", "1d_pct") + "%"),
        ("5-Day Change",   p("performance", "5d_pct") + "%"),
        ("10-Day Change",  p("performance", "10d_pct") + "%"),
        ("Prev Day High",  v("prev_day_high")),
        ("Prev Day Low",   v("prev_day_low")),
        ("Prev Day Close", v("prev_day_close")),
        ("Week High",      v("week_high")),
        ("Week Low",       v("week_low")),
    ]
    for row in rows:
        t.add_row(*row)
    return t


def _candles_table(inst: Dict) -> Table:
    name = inst.get("name", "NQ")
    t = Table(title=f"[bold]{name} -- Last 5 Daily Candles[/]", box=box.SIMPLE, expand=True)
    t.add_column("Date")
    t.add_column("Open",  justify="right")
    t.add_column("High",  justify="right")
    t.add_column("Low",   justify="right")
    t.add_column("Close", justify="right")
    t.add_column("Dir",   justify="center", width=6)
    for c in inst.get("recent_candles", []):
        col = "green" if c["direction"] == "UP" else "red"
        t.add_row(
            c["date"], str(c["open"]), str(c["high"]),
            str(c["low"]), str(c["close"]),
            f"[{col}]{c['direction']}[/]",
        )
    return t


def _news_table(items: List[Dict], title: str, max_rows: int = 15) -> Table:
    t = Table(title=f"[bold white]{title}[/]", box=box.SIMPLE, show_lines=True, expand=True)
    t.add_column("#", width=3, style="dim")
    t.add_column("Headline")
    for i, item in enumerate(items[:max_rows], 1):
        t.add_row(str(i), item.get("title", ""))
    return t


def _calendar_table(events: List[Dict]) -> Table:
    t = Table(title="[bold yellow]Economic Calendar[/]", box=box.SIMPLE_HEAVY, expand=True)
    t.add_column("Impact",   width=8, justify="center")
    t.add_column("Event")
    t.add_column("Actual",   justify="right", width=10)
    t.add_column("Forecast", justify="right", width=10, style="dim")
    t.add_column("Previous", justify="right", width=10, style="dim")
    impact_col = {"3": "red", "2": "yellow", "1": "dim",
                  "HIGH": "red", "MEDIUM": "yellow", "LOW": "dim"}
    for e in events:
        if not e.get("title"): continue
        imp = str(e.get("impact", ""))
        col = impact_col.get(imp, impact_col.get(imp.upper(), "white"))
        t.add_row(f"[{col}]{imp}[/]", e.get("title", ""),
                  e.get("actual", "-"), e.get("forecast", "-"), e.get("previous", "-"))
    return t


def _playbook_panel(playbook: Dict) -> Panel:
    from rich.table import Table

    if not playbook or playbook.get("error"):
        err = playbook.get("error", "No data") if playbook else "No data"
        return Panel(f"[dim]{err}[/]", title="[bold magenta] PLAYBOOK MATCH [/]",
                     border_style="magenta")

    day_type   = playbook.get("day_type", "?")
    day_conf   = playbook.get("day_confidence", "?")
    day_score  = playbook.get("day_score", 0)
    strategies = playbook.get("active_strategies", [])
    off        = playbook.get("off_strategies", [])
    reasons    = playbook.get("day_reasons", [])
    risk_note  = playbook.get("risk_note", "")

    day_col = "green" if day_type == "TREND" else "cyan"
    conf_col = {"HIGH": "green", "MEDIUM": "yellow", "LOW": "dim"}.get(day_conf, "white")

    body = Text()
    body.append(f"  Day Type: ", style="bold white")
    body.append(f"{day_type}  ", style=f"bold {day_col}")
    body.append(f"({day_conf} confidence, score {day_score:+d})\n", style=conf_col)
    for r in reasons:
        body.append(f"  · {r}\n", style="dim")
    body.append("\n")

    # Active strategies table
    t = Table(box=box.SIMPLE, expand=True, show_header=True)
    t.add_column("Setup", style="bold cyan", width=7)
    t.add_column("Name", width=30)
    t.add_column("Win%", width=9, justify="center")
    t.add_column("R:R", width=12, justify="center")
    t.add_column("Direction", width=7, justify="center")
    t.add_column("Entry Guidance")

    dir_styles = {"BUY": "green", "SELL": "red", "BOTH": "yellow", "FOLLOW TREND": "cyan"}

    for s in strategies:
        key  = s.get("key", "?")
        cond = s.get("condition_met", True)
        dir_ = s.get("direction", "?")
        dir_col = dir_styles.get(dir_, "white")
        dim_prefix = "" if cond else "[dim]"
        t.add_row(
            f"{dim_prefix}[bold]{key}[/]",
            f"{dim_prefix}{s.get('name','?')}",
            f"{dim_prefix}{s.get('win_rate','?')}",
            f"{dim_prefix}{s.get('rr','?')}",
            f"[{dir_col}]{dir_}[/]",
            f"{dim_prefix}{s.get('entry','?')}",
        )

    # OFF strategies
    off_str = "  [dim]OFF today: " + ", ".join(off) + "[/]" if off else ""

    # Risk note
    risk_str = f"\n  [yellow]Risk:[/] [dim]{risk_note}[/]"

    # Key levels
    levels = playbook.get("key_levels", [])
    levels_str = ""
    if levels:
        levels_str = "\n  [dim]Key Levels: " + " | ".join(levels[:6]) + "[/]"

    return Panel(
        Group(body, t, Text(off_str), Text(risk_str + levels_str)),
        title="[bold magenta] PLAYBOOK — STRATEGY ALIGNMENT [/]",
        border_style="magenta",
    )


def print_full_report(report: Dict):
    console.rule(f"[bold blue] NQ Bias Report -- {report.get('date','?')} [/]")
    console.print()

    # Banner
    console.print(
        _side_banner(
            report.get("side", "NEUTRAL"),
            report.get("bias_nq", "NEUTRAL"),
            report.get("date", "?"),
        ),
        justify="center",
    )
    console.print()

    # Macro
    if report.get("macro"):
        console.print(_macro_table(report["macro"]))
        console.print()

    # NQ price summary + candles
    nq = report.get("nq", {})
    if nq:
        console.print(_price_table(nq))
        console.print()
        console.print(_candles_table(nq))
        console.print()

    # News
    yahoo      = report.get("yahoo", {})
    tv         = report.get("tradingview", {})
    yahoo_items = yahoo.get("items", [])
    tv_items    = tv.get("news", [])
    cal         = tv.get("economic_calendar", [])

    if yahoo_items:
        console.print(_news_table(yahoo_items, "Yahoo Finance -- Headlines", 15))
        console.print()
    if tv_items:
        console.print(_news_table(tv_items, "TradingView -- Market News", 10))
        console.print()
    if cal:
        console.print(_calendar_table(cal))
        console.print()

    # Playbook strategy alignment
    playbook = report.get("playbook")
    if playbook is not None:
        console.print(_playbook_panel(playbook))
        console.print()

    # AI Analysis
    analysis = report.get("analysis", {})
    text = analysis.get("analysis", "") if isinstance(analysis, dict) else str(analysis)
    src  = analysis.get("source", "?")  if isinstance(analysis, dict) else "?"
    console.print(Panel(
        Markdown(text),
        title=f"[bold yellow] ANALYSIS & PREDICTION ({src}) [/]",
        border_style="yellow",
    ))
    console.print()
    console.rule(style="blue")


def print_history_list(dates: List[str]):
    from storage.store import load_report
    t = Table(title="[bold white]Saved Analyses[/]", box=box.SIMPLE_HEAVY)
    t.add_column("Date",   style="cyan")
    t.add_column("NQ")
    t.add_column("Side")
    t.add_column("Source", style="dim")
    for d in dates:
        r = load_report(d)
        if r:
            t.add_row(
                d,
                f"[{_bias_style(r.get('bias_nq','?'))}]{r.get('bias_nq','?')}[/]",
                f"[{_bias_style(r.get('side','?'))}]{r.get('side','?')}[/]",
                r.get("analysis", {}).get("source", "?") if isinstance(r.get("analysis"), dict) else "?",
            )
    console.print(t)


def print_news_only(yahoo: Dict, tradingview: Dict = None):
    items = yahoo.get("items", [])
    if items:
        console.print(_news_table(items, "Yahoo Finance -- Headlines", 15))
        console.print()
    if tradingview:
        tv_items = tradingview.get("news", [])
        if tv_items:
            console.print(_news_table(tv_items, "TradingView -- Market News", 12))
            console.print()
        cal = tradingview.get("economic_calendar", [])
        if cal:
            console.print(_calendar_table(cal))
