"""
Fetches macro market overview from worldmonitor.app.
"""
import requests
from bs4 import BeautifulSoup
from typing import Dict, List

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

URL = "https://www.worldmonitor.app"


def scrape_worldmonitor() -> Dict:
    """
    Returns a dict with market data rows extracted from worldmonitor.app.
    """
    try:
        resp = requests.get(URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        rows: List[Dict] = []

        # Try to find table rows or data cards
        for row in soup.select("tr"):
            cells = [td.get_text(strip=True) for td in row.find_all(["td", "th"])]
            if len(cells) >= 2 and cells[0]:
                rows.append({"label": cells[0], "values": cells[1:]})

        if not rows:
            # Fallback: look for any structured list items
            for item in soup.select("li, div[class*='row'], div[class*='item']"):
                text = item.get_text(separator=" | ", strip=True)
                if 10 < len(text) < 200:
                    rows.append({"label": text, "values": []})
                if len(rows) >= 40:
                    break

        # Also grab any notable text blocks (global indices, etc.)
        page_text_blocks: List[str] = []
        for tag in soup.select("h1, h2, h3, p"):
            text = tag.get_text(strip=True)
            if 20 < len(text) < 300:
                page_text_blocks.append(text)
            if len(page_text_blocks) >= 20:
                break

        return {
            "source": "World Monitor",
            "url": URL,
            "rows": rows[:40],
            "notes": page_text_blocks[:10],
            "raw_snippet": soup.get_text(separator="\n", strip=True)[:3000],
        }

    except Exception as e:
        return {
            "source": "World Monitor",
            "url": URL,
            "rows": [],
            "notes": [f"Fetch error: {e}"],
            "raw_snippet": "",
        }
