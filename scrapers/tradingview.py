"""
Fetches news and economic calendar events from TradingView public endpoints.
"""
import requests
from typing import Dict, List

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.tradingview.com/",
    "Origin": "https://www.tradingview.com",
}

NEWS_ENDPOINTS = [
    (
        "https://news-headlines.tradingview.com/v2/view/headlines/symbol"
        "?client=web&lang=en&section=&streaming=true&symbol=CME_MINI%3ANQ1%21",
        "NQ Headlines",
    ),
    (
        "https://news-headlines.tradingview.com/v2/view/headlines/symbol"
        "?client=web&lang=en&section=&streaming=true&symbol=CME_MINI%3AES1%21",
        "ES Headlines",
    ),
    (
        "https://news-headlines.tradingview.com/v2/view/headlines/symbol"
        "?client=web&lang=en&section=&streaming=true&symbol=CBOE%3AVIX",
        "VIX Headlines",
    ),
]


def _fetch_tv_news(url: str, label: str) -> List[Dict]:
    items = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        r.raise_for_status()
        data = r.json()

        # Response is typically {"items": [...]}
        raw = data if isinstance(data, list) else data.get("items", data.get("data", []))
        for entry in raw[:15]:
            if not isinstance(entry, dict):
                continue
            title   = entry.get("title", entry.get("name", ""))
            summary = entry.get("shortDescription", entry.get("description", ""))
            pub     = entry.get("published", entry.get("astDescription", ""))
            provider = entry.get("provider", {})
            src = entry.get("source", provider.get("name", "TradingView") if isinstance(provider, dict) else "TradingView")
            if title:
                items.append({
                    "title":   title,
                    "summary": summary[:200] if summary else "",
                    "source":  f"TradingView/{label} ({src})",
                    "published": str(pub),
                })
    except Exception as e:
        items.append({"title": f"[TradingView fetch error: {e}]", "source": f"TradingView/{label}", "summary": ""})
    return items


def get_economic_calendar(date_str: str) -> List[Dict]:
    """Fetch TradingView economic calendar events for a given date."""
    events = []
    try:
        url = (
            f"https://economic-calendar.tradingview.com/events"
            f"?from={date_str}T00%3A00%3A00.000Z"
            f"&to={date_str}T23%3A59%3A59.000Z"
            f"&countries=US"
        )
        r = requests.get(url, headers=HEADERS, timeout=12)
        r.raise_for_status()
        data = r.json()
        raw = data if isinstance(data, list) else data.get("result", data.get("events", []))
        for e in raw[:20]:
            title    = e.get("title", e.get("name", ""))
            country  = e.get("country", "")
            impact   = e.get("importance", e.get("impact", ""))
            actual   = e.get("actual", "")
            forecast = e.get("forecast", "")
            prev     = e.get("previous", "")
            if title:
                events.append({
                    "title":    title,
                    "country":  country,
                    "impact":   str(impact),
                    "actual":   str(actual),
                    "forecast": str(forecast),
                    "previous": str(prev),
                })
    except Exception as e:
        events.append({"title": f"[Calendar fetch error: {e}]", "impact": "?"})
    return events


def get_all_tradingview_data(date_str: str) -> Dict:
    """Aggregate TradingView news + economic calendar."""
    all_news = []
    for url, label in NEWS_ENDPOINTS:
        all_news.extend(_fetch_tv_news(url, label))

    # De-duplicate
    seen, unique = set(), []
    for item in all_news:
        key = item["title"][:50]
        if key not in seen:
            seen.add(key)
            unique.append(item)

    calendar = get_economic_calendar(date_str)

    return {
        "source": "TradingView",
        "chart_nq": "https://www.tradingview.com/chart/?symbol=CME_MINI%3ANQ1%21",
        "chart_es": "https://www.tradingview.com/chart/?symbol=CME_MINI%3AES1%21",
        "news": unique[:20],
        "economic_calendar": calendar,
    }
