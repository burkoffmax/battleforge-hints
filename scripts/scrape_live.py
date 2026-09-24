"""Refreshes the two "live" data files the site shows: the mini-events
schedule (docs/data/events.json) and the gift-code list
(docs/data/gifts.json).

Runs hourly from .github/workflows/refresh.yml -- a browser can't scrape
these itself: akurier.pl sends no CORS headers at all, so a fetch() from
the GitHub Pages origin is blocked outright. (tbgift.pages.dev does allow
CORS, but scraping both here keeps the client down to "read a JSON file"
for every section, with one parser per source instead of two.)

Stdlib only, so the workflow needs no `pip install` step. Parsers are
ported from tb_farm's app/ui/events_schedule_data.py and
app/ui/gifts_data.py -- if the desktop app's regexes get fixed for a
markup change, the same fix belongs here.

Each file is only rewritten when its *content* changed (see _write_json),
so the workflow's "commit if anything changed" step doesn't produce an
hourly no-op commit just because a timestamp moved.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "docs", "data")

EVENTS_URL = "https://akurier.pl/events"
GIFTS_URL = "https://tbgift.pages.dev/"
_TIMEOUT_SECONDS = 20

# -- events ------------------------------------------------------------------
_ROW_RE = re.compile(
    r"<tr style='background-color:[^']*'>\s*"
    r"<td>([^<]*)</td>\s*<td>([^<]*)</td>\s*<td>(.*?)</td>\s*<td>([^<]*)</td>\s*<td>([^<]*)</td>\s*</tr>",
    re.DOTALL,
)
_TAG_RE = re.compile(r"<[^>]+>")
_CURRENT_DATE_RE = re.compile(r"Current date \(CET\):\s*<br>\s*([^<]+?)\s*<br>")
_SK_MARKER = "for SK below:"
_SITE_TIME_FORMAT = "%d.%m.%Y %H:%M"

# -- gifts -------------------------------------------------------------------
_SECTION_RE = re.compile(r"<H3>(.*?)</H3>", re.DOTALL)
_ITEM_RE = re.compile(r"<li><b>([^<]*?):</b>.*?\(([^)]*)\):(.*?)</li>", re.DOTALL)
_LINK_RE = re.compile(r'<a href="([^"]*)">\s*([^<]*?)\s*</a>')


class ScrapeError(Exception):
    pass


def _fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SECONDS) as response:
            return response.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, OSError, TimeoutError) as exc:
        raise ScrapeError(f"{url}: {exc}") from exc


def _strip_tags(text: str) -> str:
    return _TAG_RE.sub("", text).strip()


def _now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None, second=0, microsecond=0)


def _site_offset(current_date: str, fetched_at: dt.datetime) -> dt.timedelta:
    """How far the site's own wall clock is ahead of UTC, rounded to 15
    minutes. The page labels its times "CET" but actually follows
    CET/CEST daylight saving -- measuring the offset from its printed
    "current date" (instead of hard-coding +1/+2) stays right across DST
    switches and even if the author moves the site to another zone."""
    site_now = dt.datetime.strptime(current_date, _SITE_TIME_FORMAT)
    quarter_hours = round((site_now - fetched_at).total_seconds() / 900)
    return dt.timedelta(minutes=15 * quarter_hours)


def _parse_event_rows(html_chunk: str, offset: dt.timedelta) -> list[dict]:
    rows = []
    for match in _ROW_RE.finditer(html_chunk):
        date, time, name, _countdown, bonus = (_strip_tags(g) for g in match.groups())
        if date == "Start date:":
            continue  # header row, not a real event
        try:
            start_site = dt.datetime.strptime(f"{date} {time}", _SITE_TIME_FORMAT)
        except ValueError:
            continue
        start_utc = start_site - offset
        rows.append({"start": start_utc.strftime("%Y-%m-%dT%H:%M:00Z"), "name": name, "bonus": bonus})
    return rows


def scrape_events() -> dict:
    html = _fetch(EVENTS_URL)
    fetched_at = _now_utc()
    match = _CURRENT_DATE_RE.search(html)
    if not match:
        raise ScrapeError("events: site clock not found -- page layout may have changed")
    offset = _site_offset(match.group(1), fetched_at)

    split_index = html.find(_SK_MARKER)
    main_html, sk_html = (html, "") if split_index == -1 else (html[:split_index], html[split_index:])
    main_rows = _parse_event_rows(main_html, offset)
    sk_rows = _parse_event_rows(sk_html, offset)
    if not main_rows and not sk_rows:
        raise ScrapeError("events: no rows found -- page layout may have changed")
    return {"main": main_rows, "sk": sk_rows}


def _link_kind(url: str) -> str:
    if url.startswith("https://totalbattle.com"):
        return "browser"
    if url.startswith("https://triumph.totalbattle.com"):
        return "triumph"
    return "mobile"


def scrape_gifts() -> dict:
    html = _fetch(GIFTS_URL)
    parts = _SECTION_RE.split(html)
    sections = []
    for i in range(1, len(parts), 2):
        title = _strip_tags(parts[i])
        chunk = parts[i + 1] if i + 1 < len(parts) else ""
        items = []
        for m in _ITEM_RE.finditer(chunk):
            item_title, code, links_blob = m.groups()
            links = [[_link_kind(url.strip()), url.strip()] for url, _label in _LINK_RE.findall(links_blob)]
            items.append({"title": item_title.strip(), "code": code.strip(), "links": links})
        if items:
            sections.append({"title": title, "items": items})
    if not sections:
        raise ScrapeError("gifts: no entries found -- page layout may have changed")
    return {"sections": sections}


def _write_json(name: str, payload: dict) -> bool:
    """Writes docs/data/<name> with an `updated` stamp, but only if the
    payload itself differs from what's already there. Returns whether
    the file was written."""
    path = os.path.join(DATA_DIR, name)
    try:
        with open(path, encoding="utf-8") as f:
            old = json.load(f)
        old.pop("updated", None)
        if old == payload:
            return False
    except (OSError, ValueError):
        pass
    out = {"updated": _now_utc().strftime("%Y-%m-%dT%H:%M:00Z"), **payload}
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    return True


def main() -> int:
    failures = 0
    for name, scraper in (("events.json", scrape_events), ("gifts.json", scrape_gifts)):
        try:
            changed = _write_json(name, scraper())
            print(f"{name}: {'updated' if changed else 'unchanged'}")
        except ScrapeError as exc:
            # One source being down must not block refreshing the other;
            # the previous file stays in place and the site keeps showing it.
            print(f"{name}: FAILED -- {exc}", file=sys.stderr)
            failures += 1
    return 1 if failures == 2 else 0


if __name__ == "__main__":
    sys.exit(main())
