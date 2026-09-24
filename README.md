# BattleForge Hints

Web version of the desktop app's **Hints** tab (`tb_farm`), a static,
mobile-friendly site for GitHub Pages:

- Summon Mastery captain order
- Academy research costs (tap cells to add up a running VP/CP total)
- Construction costs (tap cells to add up lumber/stone/iron/gold)
- Dragon evolution (orbs + estimated meat per level)
- Mini-event schedule with live countdowns, shown in the viewer's own time zone
- Gift links

No build step and no dependencies: plain HTML/CSS/JS in `docs/`.

## Layout

```
docs/                     the published site (GitHub Pages source: main /docs)
  index.html, style.css, app.js, manifest.webmanifest
  data/static.json        research, buildings, dragon, summon order   <- import script
  data/i18n.json          UI strings in the app's 6 languages         <- import script
  data/events.json        event schedule (start times in UTC)         <- scrape_live.py
  data/gifts.json         gift links                                  <- scrape_live.py
  img/                    icons/portraits, resized to webp            <- import script
scripts/
  import_from_tb_farm.py  pull static data + images from a tb_farm checkout
  scrape_live.py          scrape akurier.pl/events and tbgift.pages.dev
.github/workflows/refresh.yml   runs scrape_live.py hourly, commits if changed
```

## Why the live data is scraped server-side

akurier.pl sends no CORS headers, so the browser can't fetch it from the
Pages origin. A GitHub Actions cron job scrapes it hourly and commits the
JSON instead. The site computes countdowns itself from the UTC start
times, so they stay accurate between refreshes. Gifts are scraped the
same way to keep one data path for both.

## Updating static data from tb_farm

```
pip install Pillow
python scripts/import_from_tb_farm.py ../tb_farm
```

Rewrites `docs/data/static.json`, `docs/data/i18n.json` and `docs/img/`.
Commit and push; Pages redeploys automatically.

## Running locally

```
python -m http.server -d docs 8000
```

Then open http://localhost:8000. Opening `index.html` directly as a
`file://` URL won't work, because the browser blocks `fetch()` of the JSON files.
Refresh the live data by hand with `python scripts/scrape_live.py`.

## Publishing (one-time)

1. Create a **public** repo (Pages is free only on public repos) and push.
2. Settings → Pages → Source: *Deploy from a branch*, `main`, folder `/docs`.
3. Settings → Actions → General → Workflow permissions: *Read and write*
   (lets the refresh job push its commits).
