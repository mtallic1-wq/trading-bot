"""
Scrapes Yahoo Finance for macro news and market headlines.
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

SECTIONS = [
    ("https://finance.yahoo.com/", "homepage"),
    ("https://finance.yahoo.com/topic/economic-news/", "economic"),
    ("https://finance.yahoo.com/topic/stock-market-news/", "markets"),
]


def scrape_headlines(url: str, label: str) -> List[Dict]:
    """Return list of {title, summary, url, source} dicts."""
    headlines = []
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Yahoo Finance article cards — multiple selector patterns
        cards = (
            soup.select("h3.Mb\\(5px\\) a") or
            soup.select("li.js-stream-content h3 a") or
            soup.select("h3[class*='clamp'] a") or
            soup.select("a[data-ylk*='elm:hdln']") or
            soup.select("div[data-testid='news-stream'] li h3 a")
        )

        for tag in cards[:20]:
            title = tag.get_text(strip=True)
            href  = tag.get("href", "")
            if title and len(title) > 15:
                full_url = href if href.startswith("http") else f"https://finance.yahoo.com{href}"
                headlines.append({"title": title, "url": full_url, "source": f"Yahoo/{label}"})

        # Fallback: grab any <h3> text that looks like news
        if not headlines:
            for h3 in soup.find_all("h3"):
                text = h3.get_text(strip=True)
                if len(text) > 30:
                    headlines.append({"title": text, "url": url, "source": f"Yahoo/{label}"})
                    if len(headlines) >= 15:
                        break

    except Exception as e:
        headlines.append({"title": f"[Fetch error: {e}]", "url": url, "source": f"Yahoo/{label}"})

    return headlines


def get_all_yahoo_news() -> Dict:
    """Aggregate headlines from all Yahoo Finance sections."""
    all_items = []
    for url, label in SECTIONS:
        items = scrape_headlines(url, label)
        all_items.extend(items)

    # De-duplicate by title
    seen, unique = set(), []
    for item in all_items:
        key = item["title"][:60]
        if key not in seen:
            seen.add(key)
            unique.append(item)

    return {
        "source": "Yahoo Finance",
        "url": "https://finance.yahoo.com/",
        "items": unique[:30],
        "count": len(unique),
    }
