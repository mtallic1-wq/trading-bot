#!/usr/bin/env python3
"""
NQ/ES NYSE Session Bias Bot
----------------------------
Researches macro data from Yahoo Finance, World Monitor, and TradingView,
analyzes market structure (ICT/SMC) from price data,
and gives you a FULLY ACTIONABLE trade plan for the NYSE session.

Usage:
  python main.py                             # interactive mode
  python main.py --analyze                   # run analysis for TODAY
  python main.py --analyze --date 2026-04-09 # run analysis for a specific date
  python main.py --view 2026-04-09           # view a previously saved analysis
  python main.py --history 5                 # show last 5 saved analyses
  python main.py --news                      # show latest headlines only
  python main.py --list                      # list all saved report dates
"""

import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        description="NQ/ES NYSE Bias Bot — ICT/SMC structure + macro + actionable trade plan",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--analyze", action="store_true",
                        help="Run analysis (use --date to specify a date)")
    parser.add_argument("--date",    type=str, metavar="YYYY-MM-DD",
                        help="Date for --analyze (historical) or --view (saved report)")
    parser.add_argument("--view",    type=str, metavar="YYYY-MM-DD",
                        help="View a previously saved analysis for this date")
    parser.add_argument("--history", type=int, metavar="N", default=0,
                        help="Show last N saved analyses")
    parser.add_argument("--news",    action="store_true", help="Show latest headlines from all sources")
    parser.add_argument("--list",    action="store_true", help="List all saved report dates")

    args = parser.parse_args()

    from bot import TradingBot
    bot = TradingBot()

    if args.analyze:
        # --analyze alone = today; --analyze --date YYYY-MM-DD = historical
        bot.run_analysis(args.date)

    elif args.view:
        bot.show_date(args.view)

    elif args.date and not args.analyze:
        # --date alone = view saved report (backwards compat)
        bot.show_date(args.date)

    elif args.history > 0:
        bot.show_history(args.history)

    elif args.news:
        bot.show_news()

    elif args.list:
        from storage.store import list_reports
        from rich.console import Console
        c = Console()
        dates = list_reports()
        if dates:
            c.print("[cyan]Saved analyses:[/]\n" + "\n".join(f"  {d}" for d in dates))
        else:
            c.print("[yellow]No saved analyses yet. Run --analyze first.[/]")

    else:
        bot.interactive()


if __name__ == "__main__":
    main()
