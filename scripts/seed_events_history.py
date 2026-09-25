from __future__ import annotations

import datetime as dt
import json
import sys
import time
import urllib.error
import urllib.request

import scrape_live

CDX_URL = "https://web.archive.org/cdx/search/cdx?url=akurier.pl/events&output=json&fl=timestamp,statuscode&collapse=digest"
SNAPSHOT_URL = "https://web.archive.org/web/{ts}id_/https://akurier.pl/events"


def _get(url: str, attempts: int = 5) -> str:
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(request, timeout=60) as r:
                return r.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 503) or attempt == attempts - 1:
                raise
            time.sleep(10 * (attempt + 1))
    raise AssertionError("unreachable")


def main() -> int:
    rows = json.loads(_get(CDX_URL))[1:]
    total = 0
    for ts, status in rows:
        if status != "200":
            continue
        captured = dt.datetime.strptime(ts, "%Y%m%d%H%M%S").replace(second=0)
        try:
            events = scrape_live.parse_events_html(_get(SNAPSHOT_URL.format(ts=ts)), captured)
        except (scrape_live.ScrapeError, OSError) as exc:
            print(f"{ts}: skipped -- {exc}", file=sys.stderr)
            continue
        added = scrape_live.record_history(events, f"wayback {ts}")
        total += added
        print(f"{ts}: +{added}")
    print(f"total +{total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
