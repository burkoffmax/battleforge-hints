"""Pulls the static reference data (research/building costs, dragon
evolution, Summon Mastery order, translations) and the images it needs
out of a local tb_farm checkout into docs/, so the site stays a
standalone project with no runtime dependency on tb_farm.

Run it again whenever those tables change in the desktop app:

    python scripts/import_from_tb_farm.py [path/to/tb_farm]

(default path: ../tb_farm). Needs Pillow. tb_farm's app/ui/*_data.py
modules are plain Python with no Qt import, so they're imported directly;
the two bits that only live inside Qt window modules (Summon Mastery's
ORDER list, research-row icon resolution) are read via `ast` / re-ported
here instead of importing PySide6.
"""
from __future__ import annotations

import ast
import json
import os
import re
import shutil
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
DATA_DIR = os.path.join(DOCS, "data")
IMG_DIR = os.path.join(DOCS, "img")

# Everything the Hints tab and its six windows show; anything else in
# tb_farm's i18n table belongs to the bot UI and is left out.
_I18N_PREFIXES = (
    "hints_", "research_costs_", "building_costs_", "dragon_evolution_",
    "events_", "gifts_", "summon_mastery_",
)

# 2x the size the site displays them at, for sharp rendering on
# high-DPI phone screens.
_RESEARCH_ICON_PX = 96
_PORTRAIT_W, _PORTRAIT_H = 168, 232

# Ported from tb_farm app/ui_qt/research_cost_window.py -- see there.
_CATEGORY_ICON_PREFIX = {
    "guardsmen1": "guard", "guardsmen2": "guard",
    "specialists1": "spec", "specialists2": "spec",
    "engineer1": "eng", "engineer2": "eng",
    "monsters1": "monst", "monsters2": "monst",
}
_DEFAULT_STAT_ICON_KEYWORDS = (
    ("training cost", "training_cost"),
    ("carrying capacity", "carrying_capacity"),
    ("march speed", "march_speed"),
    ("marching speed", "march_speed"),
)
_STAT_ICON_KEYWORDS_BY_PREFIX = {
    "monst": (
        ("cost", "training_cost"),
        ("carrying capacity", "carrying_capacity"),
        ("march speed", "march_speed"),
    ),
}


def _icon_slug(name: str) -> str:
    return re.sub(r"_+", "_", "".join(ch if ch.isalnum() else "_" for ch in name.lower())).strip("_")


def _captain_slug(name: str) -> str:
    return name.lower().replace("'", "").replace("-", "_").replace(" ", "_")


def _find_ci(directory: str, stem: str) -> str | None:
    """Icon files mix .png/.PNG -- match the stem case-insensitively."""
    target = f"{stem}.png"
    for entry in os.listdir(directory):
        if entry.lower() == target:
            return os.path.join(directory, entry)
    return None


def _save_webp(img: Image.Image, dest: str):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    img.save(dest, "WEBP", quality=88, method=6)


def _fit(img: Image.Image, max_px: int) -> Image.Image:
    img = img.convert("RGBA")
    if max(img.size) > max_px:
        img.thumbnail((max_px, max_px), Image.LANCZOS)
    return img


def _research_icon(research_dir: str, name: str, category_key: str) -> str | None:
    path = _find_ci(research_dir, _icon_slug(name))
    if path is None:
        prefix = _CATEGORY_ICON_PREFIX.get(category_key)
        if prefix is not None:
            lname = name.lower()
            for keyword, stat_slug in _STAT_ICON_KEYWORDS_BY_PREFIX.get(prefix, _DEFAULT_STAT_ICON_KEYWORDS):
                if keyword in lname:
                    path = _find_ci(research_dir, f"{prefix}_{stat_slug}")
                    if path is not None:
                        break
    if path is None:
        return None
    stem = os.path.splitext(os.path.basename(path))[0].lower()
    dest = os.path.join(IMG_DIR, "research", f"{stem}.webp")
    if not os.path.exists(dest):
        _save_webp(_fit(Image.open(path), _RESEARCH_ICON_PX), dest)
    return f"research/{stem}.webp"


def _portrait(captains_dir: str, name: str) -> str | None:
    """Same crop-to-visible-content + "contain" fit as tb_farm's
    SummonMasteryWindow._load_portrait, baked into the file here so the
    browser just shows it."""
    slug = _captain_slug(name)
    path = _find_ci(captains_dir, slug)
    if path is None:
        return None
    img = Image.open(path).convert("RGBA")
    bbox = img.getchannel("A").point(lambda p: 255 if p > 128 else 0).getbbox()
    if bbox is not None:
        img = img.crop(bbox)
    w, h = img.size
    scale = min(_PORTRAIT_W / w, _PORTRAIT_H / h)
    new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    framed = Image.new("RGBA", (_PORTRAIT_W, _PORTRAIT_H), (0, 0, 0, 0))
    framed.paste(resized, ((_PORTRAIT_W - new_w) // 2, (_PORTRAIT_H - new_h) // 2), resized)
    _save_webp(framed, os.path.join(IMG_DIR, "captains", f"{slug}.webp"))
    return f"captains/{slug}.webp"


def _summon_order(tb_farm: str) -> list[str]:
    path = os.path.join(tb_farm, "app", "ui_qt", "summon_mastery_window.py")
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read())
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "ORDER" for t in node.targets):
            return ast.literal_eval(node.value)
    raise RuntimeError("ORDER not found in summon_mastery_window.py")


def main(tb_farm: str):
    tb_farm = os.path.abspath(tb_farm)
    sys.path.insert(0, tb_farm)
    from app import i18n
    from app.ui.building_cost_data import BUILDINGS
    from app.ui.dragon_evolution_data import EVOLUTIONS, tier_level_range, treat_cost
    from app.ui.gifts_data import LOCAL_SECTIONS
    from app.ui.research_cost_data import CATEGORIES, currency_for

    guide = os.path.join(tb_farm, "app", "guide")
    shutil.rmtree(IMG_DIR, ignore_errors=True)

    research = []
    for key, rows in CATEGORIES:
        research.append({
            "key": key,
            "currency": currency_for(key),
            "rows": [
                {"name": name, "icon": _research_icon(os.path.join(guide, "research"), name, key),
                 "levels": list(levels), "total": total}
                for name, levels, total in rows
            ],
        })

    buildings = []
    for name, icon_slug, levels in BUILDINGS:
        src = _find_ci(os.path.join(guide, "buildings"), icon_slug)
        icon = None
        if src is not None:
            icon = f"buildings/{icon_slug}.webp"
            _save_webp(_fit(Image.open(src), 168), os.path.join(IMG_DIR, icon))
        buildings.append({"name": name, "icon": icon, "levels": [list(level) for level in levels]})

    for resource in ("lumber", "stone", "iron", "gold"):
        _save_webp(_fit(Image.open(_find_ci(os.path.join(guide, "resources"), resource)), 64),
                   os.path.join(IMG_DIR, "resources", f"{resource}.webp"))
    for currency in ("vp", "cp"):
        _save_webp(_fit(Image.open(_find_ci(guide, currency)), 64), os.path.join(IMG_DIR, f"{currency}.webp"))

    dragon = {"evolutions": [], "tiers": []}
    for i, (evo_from, evo_to, level, orbs) in enumerate(EVOLUTIONS):
        start, end = tier_level_range(i)
        dragon["evolutions"].append({"from": evo_from, "to": evo_to, "level": level, "orbs": orbs})
        dragon["tiers"].append([[lvl, round(treat_cost(lvl))] for lvl in range(start + 1, end + 1)])

    captains_dir = os.path.join(tb_farm, "assets", "captains")
    summon = [{"name": name, "portrait": _portrait(captains_dir, name)} for name in _summon_order(tb_farm)]

    logo = Image.open(os.path.join(tb_farm, "app", "logo.png")).convert("RGBA")
    os.makedirs(IMG_DIR, exist_ok=True)
    for size, fname in ((192, "logo-192.png"), (512, "logo-512.png"), (32, "favicon-32.png"), (180, "apple-touch-icon.png")):
        logo.resize((size, size), Image.LANCZOS).save(os.path.join(IMG_DIR, fname), optimize=True)

    translations = {
        lang: {k: v for k, v in i18n._TRANSLATIONS.get(lang, {}).items() if k.startswith(_I18N_PREFIXES)}
        for lang in i18n.LANGUAGES
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    _dump("static.json", {"research": research, "buildings": buildings, "dragon": dragon, "summon": summon})
    _dump("i18n.json", {"languages": i18n.LANGUAGE_NAMES, "strings": translations})
    # Seed gifts.json with the desktop app's bundled snapshot only if the
    # scraper hasn't produced a live one yet.
    gifts_path = os.path.join(DATA_DIR, "gifts.json")
    if not os.path.exists(gifts_path):
        _dump("gifts.json", {"updated": None, "sections": LOCAL_SECTIONS})
    print(f"imported from {tb_farm}")


def _dump(name, payload):
    with open(os.path.join(DATA_DIR, name), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "tb_farm"))
