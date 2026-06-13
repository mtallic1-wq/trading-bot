"""
NQ NYSE Bias Bot — News & Macro driven analysis.
NQ (Nasdaq-100 futures) focused.
"""
import io
import sys
from datetime import datetime
from typing import Optional

# Force UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from config import NQ_TICKER, GROQ_API_KEY, REPORTS_DIR
from analysis.market_structure import get_instrument_data, get_macro_data
from analysis.bias_engine import get_bias, build_prompt
from analysis.playbook_matcher import get_playbook_match
from scrapers.yahoo import get_all_yahoo_news
from scrapers.worldmonitor import scrape_worldmonitor
from scrapers.tradingview import get_all_tradingview_data
from scrapers.tradingview_live import get_live_chart_data
from analysis.price_action import get_multi_tf_analysis
from storage.store import save_report, load_report, list_reports
from display.terminal import console, print_full_report, print_history_list, print_news_only

STEPS = [
    "Fetching NQ price data...",
    "Fetching macro data (DXY, VIX, Yields, Gold, Oil)...",
    "Scraping Yahoo Finance headlines...",
    "Scraping World Monitor...",
    "Fetching TradingView news & economic calendar...",
    "Analysing multi-timeframe market structure (D/4H/1H/15m)...",
    "Reading live chart levels from TradingView Desktop...",
    "Running AI analysis...",
]


class TradingBot:

    def run_analysis(self, date_str: Optional[str] = None) -> dict:
        if date_str is None:
            date_str = datetime.now().strftime("%Y-%m-%d")

        today   = datetime.now().strftime("%Y-%m-%d")
        is_hist = date_str < today
        label   = f"HISTORICAL — {date_str}" if is_hist else f"TODAY — {date_str}"

        console.rule(f"[bold blue] NQ Bias Bot | {label} [/]")

        if not GROQ_API_KEY:
            console.print(
                "[yellow]No GROQ_API_KEY in .env — using simple rule-based fallback.[/]\n"
                "Add your key for full AI news analysis.\n"
            )
        if is_hist:
            console.print(
                f"[cyan]Historical mode: price data as of {date_str}. "
                f"News headlines are current (live scrape).[/]\n"
            )

        data   = {}
        errors = []

        with Progress(SpinnerColumn(), TextColumn("{task.description}"),
                      console=console, transient=True) as progress:
            task = progress.add_task("...", total=len(STEPS))

            for step, key, fn in [
                (STEPS[0], "nq",              lambda: get_instrument_data(NQ_TICKER, "NQ Nasdaq-100 Futures", end_date=date_str)),
                (STEPS[1], "macro",           lambda: get_macro_data(end_date=date_str)),
                (STEPS[2], "yahoo",           get_all_yahoo_news),
                (STEPS[3], "worldmonitor",    scrape_worldmonitor),
                (STEPS[4], "tradingview",     lambda: get_all_tradingview_data(date_str)),
                (STEPS[5], "price_action",    lambda: get_multi_tf_analysis(NQ_TICKER)),
                (STEPS[6], "tv_live",         get_live_chart_data),
            ]:
                progress.update(task, description=step)
                try:
                    data[key] = fn()
                except Exception as e:
                    data[key] = {"available": False, "error": str(e)}
                    errors.append(f"{key}: {e}")
                progress.advance(task)

            progress.update(task, description=STEPS[7])
            try:
                analysis = get_bias(
                    data.get("nq", {}),
                    data.get("macro", {}),
                    data.get("yahoo", {}),
                    data.get("worldmonitor", {}),
                    data.get("tradingview", {}),
                    date_str,
                    price_action=data.get("price_action", {}),
                    tv_live=data.get("tv_live", {}),
                )
            except Exception as e:
                analysis = {
                    "analysis": f"Analysis error: {e}",
                    "bias_nq":  "NEUTRAL",
                    "side":     "NEUTRAL",
                    "source":   "Error",
                }
            progress.advance(task)

        # Playbook strategy alignment
        try:
            playbook = get_playbook_match(
                analysis["bias_nq"],
                analysis["side"],
                data.get("nq", {}),
                data.get("price_action", {}),
                data.get("macro", {}),
            )
        except Exception as e:
            playbook = {"error": str(e)}

        report = {
            "date":          date_str,
            "created":       datetime.now().isoformat(),
            "is_historical": is_hist,
            "bias_nq":       analysis["bias_nq"],
            "side":          analysis["side"],
            "nq":            data.get("nq", {}),
            "macro":         data.get("macro", {}),
            "yahoo":         data.get("yahoo", {}),
            "worldmonitor":  data.get("worldmonitor", {}),
            "tradingview":   data.get("tradingview", {}),
            "price_action":  data.get("price_action", {}),
            "tv_live":       data.get("tv_live", {}),
            "analysis":      analysis,
            "playbook":      playbook,
            "errors":        errors,
        }

        path = save_report(report, date_str)

        # Save a plain-text prompt file for manual AI review
        prompt_text = build_prompt(
            data.get("nq", {}),
            data.get("macro", {}),
            data.get("yahoo", {}),
            data.get("worldmonitor", {}),
            data.get("tradingview", {}),
            date_str,
            price_action=data.get("price_action", {}),
            tv_live=data.get("tv_live", {}),
        )
        prompt_path = REPORTS_DIR / f"{date_str}.txt"
        prompt_path.write_text(prompt_text, encoding="utf-8")

        console.print(f"[dim]Saved: {path}[/]")
        console.print(f"[dim]Prompt: {prompt_path}[/]")
        print_full_report(report)
        return report

    def show_history(self, n: int = 10):
        dates = list_reports()
        if not dates:
            console.print("[yellow]No saved analyses yet.[/]")
            return
        console.rule(f"[bold white] Last {min(n, len(dates))} Analyses [/]")
        print_history_list(dates[:n])

    def show_date(self, date_str: str):
        report = load_report(date_str)
        if report is None:
            console.print(f"[red]No saved analysis for {date_str}.[/]")
            available = list_reports()[:5]
            if available:
                console.print(f"Run: analyze {date_str}  to generate it.")
                console.print(f"Available: {', '.join(available)}")
            return
        print_full_report(report)

    def show_news(self):
        console.rule("[bold white] Live Headlines [/]")
        yahoo = get_all_yahoo_news()
        tv    = get_all_tradingview_data(datetime.now().strftime("%Y-%m-%d"))
        print_news_only(yahoo, tv)

    def interactive(self):
        console.rule("[bold blue] NQ Bias Bot — Interactive [/]")
        console.print(
            "\n  Commands:\n"
            "  [cyan]analyze[/]                  — Analyze today\n"
            "  [cyan]analyze YYYY-MM-DD[/]       — Analyze a specific date (historical)\n"
            "  [cyan]view YYYY-MM-DD[/]          — View a saved analysis\n"
            "  [cyan]history [N][/]              — Show last N saved analyses\n"
            "  [cyan]news[/]                     — Show latest headlines\n"
            "  [cyan]list[/]                     — List all saved dates\n"
            "  [cyan]quit[/]                     — Exit\n"
        )
        while True:
            try:
                line = input("\n> ").strip()
            except (EOFError, KeyboardInterrupt):
                console.print("\n[dim]Goodbye.[/]")
                break
            if not line:
                continue
            parts = line.split()
            cmd   = parts[0].lower()

            if cmd in ("quit", "exit", "q"):
                console.print("[dim]Goodbye.[/]")
                break
            elif cmd == "analyze":
                self.run_analysis(parts[1] if len(parts) > 1 else None)
            elif cmd == "view" and len(parts) > 1:
                self.show_date(parts[1])
            elif cmd == "history":
                n = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 10
                self.show_history(n)
            elif cmd == "news":
                self.show_news()
            elif cmd == "list":
                dates = list_reports()
                console.print("[cyan]Saved:[/]\n" + "\n".join(f"  {d}" for d in dates) if dates else "[yellow]None yet.[/]")
            else:
                console.print(f"[red]Unknown:[/] {cmd}")
