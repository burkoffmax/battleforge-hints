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
HISTORY_PATH = os.path.join(ROOT, "history", "events.json")

EVENTS_URL = "https://akurier.pl/events"
GIFTS_URL = "https://tbgift.pages.dev/"
_TIMEOUT_SECONDS = 20

_ROW_RE = re.compile(
    r"<tr style='background-color:[^']*'>\s*"
    r"<td>([^<]*)</td>\s*<td>([^<]*)</td>\s*<td>(.*?)</td>\s*<td>([^<]*)</td>\s*<td>([^<]*)</td>\s*</tr>",
    re.DOTALL,
)
_TAG_RE = re.compile(r"<[^>]+>")
_CURRENT_DATE_RE = re.compile(r"Current date \(CET\):\s*<br>\s*([^<]+?)\s*<br>")
_SK_MARKER = "for SK below:"
_SITE_TIME_FORMAT = "%d.%m.%Y %H:%M"

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
    site_now = dt.datetime.strptime(current_date, _SITE_TIME_FORMAT)
    quarter_hours = round((site_now - fetched_at).total_seconds() / 900)
    return dt.timedelta(minutes=15 * quarter_hours)


def _parse_event_rows(html_chunk: str, offset: dt.timedelta) -> list[dict]:
    rows = []
    for match in _ROW_RE.finditer(html_chunk):
        date, time, name, _countdown, bonus = (_strip_tags(g) for g in match.groups())
        if date == "Start date:":
            continue
        try:
            start_site = dt.datetime.strptime(f"{date} {time}", _SITE_TIME_FORMAT)
        except ValueError:
            continue
        start_utc = start_site - offset
        rows.append({"start": start_utc.strftime("%Y-%m-%dT%H:%M:00Z"), "name": name, "bonus": bonus})
    return rows


def scrape_events() -> dict:
    html = _fetch(EVENTS_URL)
    return parse_events_html(html, _now_utc())


def parse_events_html(html: str, fetched_at: dt.datetime) -> dict:
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


def record_history(events: dict, seen: str) -> int:
    try:
        with open(HISTORY_PATH, encoding="utf-8") as f:
            history = json.load(f)
    except (OSError, ValueError):
        history = []
    known = {(e["server"], e["start"], e["name"]) for e in history}
    added = 0
    for server in ("main", "sk"):
        for row in events.get(server, []):
            key = (server, row["start"], row["name"])
            if key in known:
                continue
            known.add(key)
            history.append({"server": server, **row, "seen": seen})
            added += 1
    if added:
        history.sort(key=lambda e: (e["server"], e["start"]))
        os.makedirs(os.path.dirname(HISTORY_PATH), exist_ok=True)
        with open(HISTORY_PATH, "w", encoding="utf-8") as f:
            f.write("[\n" + ",\n".join(json.dumps(e, ensure_ascii=False) for e in history) + "\n]\n")
    return added


def main() -> int:
    failures = 0
    for name, scraper in (("events.json", scrape_events), ("gifts.json", scrape_gifts)):
        try:
            payload = scraper()
            if name == "events.json":
                added = record_history(payload, "live " + _now_utc().strftime("%Y-%m-%dT%H:%MZ"))
                print(f"history: +{added} events")
            changed = _write_json(name, payload)
            print(f"{name}: {'updated' if changed else 'unchanged'}")
        except ScrapeError as exc:
            print(f"{name}: FAILED -- {exc}", file=sys.stderr)
            failures += 1
    return 1 if failures == 2 else 0


if __name__ == "__main__":
    sys.exit(main())
