"use strict";

const SITE_STRINGS = {
  en: {
    back: "Back", language: "Language", started: "Started",
    tz_note: "Times are shown in your time zone ({tz}).",
    source: "Source: {link}", no_data: "No data yet.",
    cal_main: "Main events",
    cal_mini: "Mini events",
    today: "Today",
    new_day_in: "New day in {time}",
    cal_note: "A game day starts at {time} your time. Dates are calculated from the game's fixed cycles (6, 12 and 24 days), so the game may occasionally deviate.",
    cal_incomplete: "Some events of this day are not recorded yet.",
    kind_monthly: "Every 24 days",
    kind_biweekly: "Every 12 days",
    kind_weekly: "Every 6 days",
    now: "Now",
    until: "until {time}",
  },
  ru: {
    back: "Назад", language: "Язык", started: "Идёт",
    tz_note: "Время указано в вашем часовом поясе ({tz}).",
    source: "Источник: {link}", no_data: "Данных пока нет.",
    cal_main: "Основные события",
    cal_mini: "Мини-события",
    today: "Сегодня",
    new_day_in: "Новый день через {time}",
    cal_note: "Игровой день начинается в {time} по вашему времени. Даты рассчитаны по фиксированным циклам игры (6, 12 и 24 дня), поэтому игра изредка может отклоняться.",
    cal_incomplete: "Часть событий этого дня ещё не записана.",
    kind_monthly: "Раз в 24 дня",
    kind_biweekly: "Раз в 12 дней",
    kind_weekly: "Раз в 6 дней",
    now: "Сейчас",
    until: "до {time}",
  },
  fr: {
    back: "Retour", language: "Langue", started: "En cours",
    tz_note: "Heures affichées dans votre fuseau horaire ({tz}).",
    source: "Source : {link}", no_data: "Pas encore de données.",
    cal_main: "Événements principaux",
    cal_mini: "Mini-événements",
    today: "Aujourd'hui",
    new_day_in: "Nouveau jour dans {time}",
    cal_note: "Une journée de jeu commence à {time} (votre heure). Dates calculées d'après les cycles fixes du jeu (6, 12 et 24 jours) ; le jeu peut parfois s'en écarter.",
    cal_incomplete: "Certains événements de ce jour ne sont pas encore enregistrés.",
    kind_monthly: "Tous les 24 jours",
    kind_biweekly: "Tous les 12 jours",
    kind_weekly: "Tous les 6 jours",
    now: "Maintenant",
    until: "jusqu'à {time}",
  },
  de: {
    back: "Zurück", language: "Sprache", started: "Läuft",
    tz_note: "Zeiten in deiner Zeitzone ({tz}).",
    source: "Quelle: {link}", no_data: "Noch keine Daten.",
    cal_main: "Hauptevents",
    cal_mini: "Mini-Events",
    today: "Heute",
    new_day_in: "Neuer Tag in {time}",
    cal_note: "Ein Spieltag beginnt um {time} (deine Zeit). Termine sind aus den festen Zyklen des Spiels (6, 12 und 24 Tage) berechnet; das Spiel kann gelegentlich abweichen.",
    cal_incomplete: "Einige Events dieses Tages sind noch nicht erfasst.",
    kind_monthly: "Alle 24 Tage",
    kind_biweekly: "Alle 12 Tage",
    kind_weekly: "Alle 6 Tage",
    now: "Jetzt",
    until: "bis {time}",
  },
  pt: {
    back: "Voltar", language: "Idioma", started: "Em andamento",
    tz_note: "Horários no seu fuso horário ({tz}).",
    source: "Fonte: {link}", no_data: "Ainda sem dados.",
    cal_main: "Eventos principais",
    cal_mini: "Mini eventos",
    today: "Hoje",
    new_day_in: "Novo dia em {time}",
    cal_note: "Um dia de jogo começa às {time} no seu horário. As datas são calculadas pelos ciclos fixos do jogo (6, 12 e 24 dias), então o jogo pode ocasionalmente variar.",
    cal_incomplete: "Alguns eventos deste dia ainda não foram registrados.",
    kind_monthly: "A cada 24 dias",
    kind_biweekly: "A cada 12 dias",
    kind_weekly: "A cada 6 dias",
    now: "Agora",
    until: "até {time}",
  },
  tr: {
    back: "Geri", language: "Dil", started: "Başladı",
    tz_note: "Saatler kendi saat diliminizde gösterilir ({tz}).",
    source: "Kaynak: {link}", no_data: "Henüz veri yok.",
    cal_main: "Ana etkinlikler",
    cal_mini: "Mini etkinlikler",
    today: "Bugün",
    new_day_in: "Yeni gün: {time}",
    cal_note: "Oyun günü sizin saatinizle {time} itibarıyla başlar. Tarihler oyunun sabit döngülerinden (6, 12 ve 24 gün) hesaplanır; oyun zaman zaman sapabilir.",
    cal_incomplete: "Bu günün bazı etkinlikleri henüz kaydedilmedi.",
    kind_monthly: "24 günde bir",
    kind_biweekly: "12 günde bir",
    kind_weekly: "6 günde bir",
    now: "Şimdi",
    until: "{time} kadar",
  },
};

const GIFT_SECTION_KEYS = {
  "Daily Links - Work once a week on the given day": "gifts_section_daily",
  "One-Time Links without expiry date": "gifts_section_onetime",
  "Event Links - Only Work During The Roulette Event - Only Try Then!": "gifts_section_event",
  "Older ones may no longer work!": "gifts_section_older_warning",
  "Links that never worked for me": "gifts_section_broken",
};

const SECTIONS = [
  { route: "summon", glyph: "🎖", key: "hints_section_summon_mastery", render: renderSummon },
  { route: "research", glyph: "🔬", key: "hints_section_research_costs", render: renderResearch },
  { route: "buildings", glyph: "🏗", key: "hints_section_building_costs", render: renderBuildings },
  { route: "dragon", glyph: "🐉", key: "hints_section_dragon_evolution", render: renderDragon },
  { route: "events", glyph: "📅", key: "hints_section_events", render: renderEvents },
  { route: "gifts", glyph: "🎁", key: "hints_section_gifts", render: renderGifts },
];

const RESOURCES = ["lumber", "stone", "iron", "gold"];
const EVENTS_URL = "https://akurier.pl/events";
const GIFTS_URL = "https://tbgift.pages.dev/";

const $view = document.getElementById("view");
const $sumbar = document.getElementById("sumbar");
const $back = document.getElementById("back");
const $title = document.getElementById("title");
const $lang = document.getElementById("lang");

let I18N = null;
let STATIC = null;
let CAL = null;
let lang = "en";
let cleanups = [];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem("tbh." + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (_) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem("tbh." + key, JSON.stringify(value)); } catch (_) {}
}

function t(key, vars) {
  const table = I18N.strings[lang] || {};
  const site = SITE_STRINGS[lang] || {};
  let text = table[key] ?? site[key] ?? I18N.strings.en[key] ?? SITE_STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(v);
  return text;
}

function pickLanguage() {
  const saved = load("lang", null);
  if (saved && I18N.languages[saved]) return saved;
  for (const tag of navigator.languages || [navigator.language || "en"]) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (I18N.languages[code]) return code;
  }
  return "en";
}

const SUFFIXES = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
function formatCompact(value) {
  for (const [suffix, mult] of SUFFIXES) if (value >= mult) return (value / mult).toFixed(1) + suffix;
  return value.toFixed(0);
}
function parseCompact(text) {
  text = String(text || "").trim();
  if (!text) return null;
  const hit = SUFFIXES.find(([s]) => s === text.slice(-1));
  const n = parseFloat(hit ? text.slice(0, -1) : text);
  if (Number.isNaN(n)) return null;
  return hit ? n * hit[1] : n;
}

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}
const img = (src, alt, cls) => h("img", { src: "img/" + src, alt: alt || "", class: cls, loading: "lazy", decoding: "async" });

async function fetchJson(path, bust) {
  const res = await fetch(bust ? `${path}?t=${Date.now()}` : path, { cache: bust ? "no-store" : "default" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatClock(date) {
  return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function errorBox(message) {
  return h("div", { class: "error" }, h("div", { class: "glyph" }, "⚠"), h("p", {}, message));
}

function credits(url) {
  const host = new URL(url).host;
  const p = h("footer", { class: "credits" });
  const [before, after] = t("source").split("{link}");
  p.append(before, h("a", { href: url, target: "_blank", rel: "noopener" }, host), after || "");
  return p;
}

function makeSelection(storeKey, currencies, iconFor, prefix) {
  const selected = load(storeKey, {});

  function totals() {
    const out = Object.fromEntries(currencies.map((c) => [c, 0]));
    for (const { v, c } of Object.values(selected)) if (c in out) out[c] += v;
    return out;
  }
  function drawBar() {
    const sums = totals();
    $sumbar.replaceChildren(...[
      prefix ? h("span", { class: "label" }, prefix) : null,
      ...currencies.map((c) => h("span", { class: "sum" }, img(iconFor(c), c), formatCompact(sums[c]))),
      h("button", {
        class: "btn reset", type: "button", title: t("research_costs_reset_tooltip"),
        "aria-label": t("research_costs_reset_tooltip"),
        onclick: () => {
          for (const k of Object.keys(selected)) delete selected[k];
          save(storeKey, selected);
          for (const el of $view.querySelectorAll(".pick.on")) {
            el.classList.remove("on");
            el.setAttribute("aria-pressed", "false");
          }
          drawBar();
        },
      }, "⟲", h("span", { class: "reset-text" }, t("research_costs_reset_tooltip"))),
    ].filter(Boolean));
  }
  $sumbar.hidden = false;
  document.body.classList.add("has-sumbar");
  cleanups.push(() => { $sumbar.hidden = true; document.body.classList.remove("has-sumbar"); });
  drawBar();

  return {
    has: (key) => key in selected,
    toggle(key, text, currency) {
      if (key in selected) delete selected[key];
      else {
        const v = parseCompact(text);
        if (v === null) return false;
        selected[key] = { v, c: currency };
      }
      save(storeKey, selected);
      drawBar();
      return key in selected;
    },
  };
}

function pickable(el, sel, key, text, currency) {
  el.classList.add("pick");
  el.classList.toggle("on", sel.has(key));
  el.setAttribute("aria-pressed", String(sel.has(key)));
  const native = el.tagName === "BUTTON";
  if (!native) {
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
  }
  const flip = () => {
    const on = sel.toggle(key, text, currency);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", String(on));
  };
  el.addEventListener("click", flip);
  if (!native) {
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  }
  return el;
}

function watchWidth(query, draw) {
  const mq = window.matchMedia(query);
  const handler = () => draw(mq.matches);
  mq.addEventListener("change", handler);
  cleanups.push(() => mq.removeEventListener("change", handler));
  draw(mq.matches);
}

function renderHome() {
  $view.append(
    h("nav", { class: "tiles", "aria-label": t("hints_menu") },
      SECTIONS.map((s) => h("a", { class: "tile", href: "#/" + s.route },
        h("span", { class: "glyph", "aria-hidden": "true" }, s.glyph), t(s.key)))),
  );
}

const DAY = 86400000;
const mod = (a, n) => ((a % n) + n) % n;
const dayNumber = (iso) => Date.parse(iso + "T00:00:00Z") / DAY;
const dayStartMs = (k) => k * DAY + CAL.day_start_utc_hour * 3600000;
const currentGameDay = () => Math.floor((Date.now() - CAL.day_start_utc_hour * 3600000) / DAY);

function eventsOnDay(k) {
  const out = [];
  for (const e of CAL.events) {
    const n = mod(k - dayNumber(e.first), e.period);
    const span = e.stages ? e.stages.length : e.span || 1;
    if (n < span) out.push({ ...e, dayOf: n, span });
  }
  return out;
}

function summonSlot(k) {
  const s = CAL.summon;
  return mod(Math.floor((k - dayNumber(s.first)) / s.days) + s.position - 1, STATIC.summon.length);
}

function summonSlotEnd(k) {
  const s = CAL.summon;
  const first = dayNumber(s.first);
  return dayStartMs(first + (Math.floor((k - first) / s.days) + 1) * s.days);
}

const isIncompleteDay = (k) => CAL.unknown.some((u) => mod(k - dayNumber(u), CAL.cycle_days) === 0);

function formatDuration(ms) {
  const mins = Math.max(0, Math.ceil(ms / 60000));
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function formatDayTime(ms) {
  return new Intl.DateTimeFormat(lang, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
}

function renderSummon() {
  const now = currentGameDay();
  const current = summonSlot(now);
  const cur = STATIC.summon[current];
  const next = STATIC.summon[(current + 1) % STATIC.summon.length];
  $view.append(
    h("div", { class: "calday today summon-now" },
      cur.portrait ? h("img", { src: "img/" + cur.portrait, alt: "", width: 42, height: 58 }) : null,
      h("div", {},
        h("b", {}, `${t("now")}: ${cur.name} (#${current + 1})`),
        h("div", { class: "status" }, t("until", { time: formatDayTime(summonSlotEnd(now)) }), ` → ${next.name}`))),
    h("p", { class: "hint" }, t("summon_mastery_hint")),
    h("ol", { class: "summon", style: "list-style:none;padding:0;margin:0" },
      STATIC.summon.map((c, i) => h("li", { class: i === current ? "captain now" : "captain" },
        h("span", { class: "pos" }, "#" + (i + 1)),
        c.portrait ? h("img", { src: "img/" + c.portrait, alt: c.name, width: 84, height: 116, loading: "lazy" }) : null,
        h("span", { class: "nm" }, c.name),
        i === current
          ? h("span", { class: "now-badge" }, t("now"), " · ", t("until", { time: formatDayTime(summonSlotEnd(now)) }))
          : null))),
  );
}

function renderResearch() {
  const cats = STATIC.research;
  let ci = Math.min(load("research.cat", 0), cats.length - 1);
  const sel = makeSelection("research.sel", ["vp", "cp"], (c) => c + ".webp", t("research_costs_sum_prefix"));

  const select = h("select", {
    id: "cat", onchange: (e) => { ci = Number(e.target.value); save("research.cat", ci); draw(); },
  }, cats.map((c, i) => h("option", { value: i, selected: i === ci }, t(`research_costs_cat_${c.key}`))));
  const body = h("div");
  $view.append(h("div", { class: "toolbar" }, h("label", { for: "cat" }, t("research_costs_category_label"), select)), body);

  let wide = false;
  function draw() {
    const cat = cats[ci];
    body.replaceChildren(wide ? researchTable(cat, ci, sel) : researchCards(cat, ci, sel));
  }
  watchWidth("(min-width: 900px)", (m) => { wide = m; draw(); });
}

function researchTable(cat, ci, sel) {
  const head = h("tr", {},
    h("th", {}, t("research_costs_col_research")),
    Array.from({ length: 10 }, (_, i) => h("th", {}, i + 1)),
    h("th", {}, h("span", { class: "th-icon" }, img(cat.currency + ".webp", cat.currency), t("research_costs_col_total"))));
  const rows = cat.rows.map((row, r) => h("tr", {},
    h("td", { class: "name" }, h("div", { class: "name-in" }, row.icon ? img(row.icon) : null, h("span", {}, row.name))),
    row.levels.map((v, i) => cell(v, `${ci}|${r}|${i + 1}`, "num")),
    cell(row.total, `${ci}|${r}|11`, "num total")));

  function cell(value, key, cls) {
    const td = h("td", { class: cls }, value);
    return value ? pickable(td, sel, key, value, cat.currency) : td;
  }
  return h("div", { class: "table-wrap" }, h("table", { class: "rtable" }, h("thead", {}, head), h("tbody", {}, rows)));
}

function researchCards(cat, ci, sel) {
  return h("div", { class: "rcards" }, cat.rows.map((row, r) => {
    const unlock = row.levels.slice(1).every((v) => !v);
    const total = pickable(
      h("button", { class: "chip total", type: "button" }, h("small", {}, t("research_costs_col_total")), row.total),
      sel, `${ci}|${r}|11`, row.total, cat.currency);
    return h("div", { class: "rcard" },
      h("div", { class: "rcard-head" }, row.icon ? img(row.icon) : null, h("div", { class: "rcard-name" }, row.name), total),
      unlock ? null : h("div", { class: "levels" }, row.levels.map((v, i) => v
        ? pickable(h("button", { class: "chip", type: "button" }, h("small", {}, i + 1), v), sel, `${ci}|${r}|${i + 1}`, v, cat.currency)
        : h("span", { class: "chip", "aria-hidden": "true" }))));
  }));
}

function renderBuildings() {
  const list = STATIC.buildings;
  let bi = Math.min(load("buildings.idx", 0), list.length - 1);
  const sel = makeSelection("buildings.sel", RESOURCES, (c) => `resources/${c}.webp`, null);

  const icon = h("img", { alt: "", width: 56, height: 56 });
  const select = h("select", {
    id: "bld", onchange: (e) => { bi = Number(e.target.value); save("buildings.idx", bi); draw(); },
  }, list.map((b, i) => h("option", { value: i, selected: i === bi }, b.name)));
  const body = h("div");
  $view.append(
    h("div", { class: "toolbar" },
      h("label", { for: "bld" }, t("building_costs_building_label"), select), h("span", { class: "spacer" }), icon),
    body);

  function draw() {
    const b = list[bi];
    icon.src = b.icon ? "img/" + b.icon : "";
    icon.hidden = !b.icon;
    const head = h("tr", {}, h("th", {}, t("building_costs_col_level")),
      RESOURCES.map((res) => h("th", {}, img(`resources/${res}.webp`, res, "res"))));
    const rows = b.levels.map(([level, ...values], r) => h("tr", {},
      h("td", { class: "lvl" }, level),
      values.map((v, i) => {
        const td = h("td", { class: "num" }, v);
        return v ? pickable(td, sel, `${bi}|${r}|${i + 1}`, v, RESOURCES[i]) : td;
      })));
    body.replaceChildren(h("div", { class: "table-wrap btable" },
      h("table", {}, h("thead", {}, head), h("tbody", {}, rows))));
  }
  draw();
}

function renderDragon() {
  const { evolutions, tiers } = STATIC.dragon;
  let ti = Math.min(load("dragon.tier", 0), tiers.length - 1);

  $view.append(
    h("h2", {}, t("hints_section_dragon_evolution")),
    h("div", { class: "table-wrap narrow-table" }, h("table", {},
      h("thead", {}, h("tr", {},
        h("th", {}, t("dragon_evolution_orbs_col_evolution")),
        h("th", {}, t("dragon_evolution_orbs_col_level")),
        h("th", {}, t("dragon_evolution_orbs_col_orbs")))),
      h("tbody", {}, evolutions.map((e) => h("tr", {},
        h("td", {}, `${e.from} → ${e.to}`), h("td", { class: "num" }, e.level), h("td", { class: "num" }, e.orbs)))))),
    h("h2", {}, t("dragon_evolution_meat_col_amount")),
    h("p", { class: "hint warn" }, t("dragon_evolution_meat_warning")),
  );

  const buttons = evolutions.map((e, i) => h("button", {
    type: "button", "aria-pressed": String(i === ti),
    onclick: () => { ti = i; save("dragon.tier", ti); draw(); },
  }, `${e.from} → ${e.to}`));
  const body = h("div");
  $view.append(h("div", { class: "seg", role: "group" }, buttons), body);

  function draw() {
    buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === ti)));
    body.replaceChildren(h("div", { class: "table-wrap narrow-table" }, h("table", {},
      h("thead", {}, h("tr", {},
        h("th", {}, t("dragon_evolution_meat_col_level")), h("th", {}, t("dragon_evolution_meat_col_amount")))),
      h("tbody", {}, tiers[ti].map(([level, cost]) => h("tr", {},
        h("td", { class: "lvl" }, level), h("td", { class: "num" }, formatCompact(cost))))))));
  }
  draw();
}

function liveToolbar(onRefresh) {
  const status = h("span", { class: "status" });
  const btn = h("button", { class: "btn", type: "button", title: t("events_refresh_tooltip"), onclick: onRefresh },
    "⟲ ", t("events_refresh_tooltip"));
  $view.append(h("div", { class: "toolbar" }, btn, status));
  return status;
}

function updatedText(iso) {
  return iso ? t("events_updated_at", { time: formatClock(new Date(iso)) }) : "";
}

function renderEvents(sub) {
  const tabs = [["", t("cal_main")], ["mini", t("cal_mini")]];
  $view.append(h("nav", { class: "seg" }, tabs.map(([route, label]) => h("a", {
    href: "#/events" + (route ? "/" + route : ""), "aria-current": sub === route ? "page" : null,
  }, label))));
  if (sub === "mini") renderMiniEvents();
  else renderCalendar();
}

const CAL_DAYS_AHEAD = 30;
const capitalize = (s) => s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);

function renderCalendar() {
  let today = currentGameDay();
  const countdown = h("span");
  const list = h("div", { class: "cal" });
  $view.append(
    h("p", { class: "hint" }, t("cal_note", { time: formatClock(new Date(dayStartMs(today))) })),
    h("div", { class: "legend" }, ["monthly", "biweekly", "weekly"].map((k) => h("span", { class: "ev " + k }, t("kind_" + k)))),
    list);

  const dateFmt = new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
  function draw() {
    list.replaceChildren(...Array.from({ length: CAL_DAYS_AHEAD }, (_, i) => {
      const k = today + i;
      const captain = STATIC.summon[summonSlot(k)];
      return h("section", { class: i === 0 ? "calday today" : "calday" },
        h("div", { class: "calday-head" },
          h("b", {}, capitalize(dateFmt.format(new Date(k * DAY)))),
          i === 0 ? h("span", { class: "today-badge" }, t("today")) : null,
          i === 0 ? h("span", { class: "status" }, countdown) : null),
        h("div", { class: "evchips" }, eventsOnDay(k).map((e) => h("span", { class: "ev " + e.kind },
          e.name,
          e.stages ? h("small", {}, " · " + e.stages[e.dayOf]) : null,
          !e.stages && e.span > 1 ? h("small", {}, ` · ${e.dayOf + 1}/${e.span}`) : null))),
        isIncompleteDay(k) ? h("p", { class: "hint warn" }, t("cal_incomplete")) : null,
        h("div", { class: "calcap", title: t("hints_section_summon_mastery") },
          captain.portrait ? h("img", { src: "img/" + captain.portrait, alt: "", width: 24, height: 33, loading: "lazy" }) : null,
          h("span", {}, "🎖 ", captain.name)));
    }));
  }
  function tick() {
    if (currentGameDay() !== today) { today = currentGameDay(); draw(); }
    countdown.textContent = t("new_day_in", { time: formatDuration(dayStartMs(today + 1) - Date.now()) });
  }
  draw();
  tick();
  const timer = setInterval(tick, 30000);
  cleanups.push(() => clearInterval(timer));
}

function renderMiniEvents() {
  const body = h("div");
  const status = liveToolbar(() => load_());
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  $view.append(h("p", { class: "hint" }, t("tz_note", { tz })), body, credits(EVENTS_URL));

  let countdowns = [];
  const tick = () => {
    const now = Date.now();
    for (const { el, row, start } of countdowns) {
      const left = start - now;
      row.classList.toggle("started", left <= 0);
      if (left <= 0) { el.textContent = t("started"); continue; }
      const mins = Math.ceil(left / 60000);
      el.textContent = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    }
  };
  let timersStarted = false;
  function startTimers() {
    if (timersStarted) return;
    timersStarted = true;
    const timer = setInterval(tick, 15000);
    const poll = setInterval(() => load_(), 10 * 60 * 1000);
    cleanups.push(() => { clearInterval(timer); clearInterval(poll); });
  }

  async function load_() {
    status.textContent = t("events_loading");
    try {
      const data = await fetchJson("data/events.json", true);
      countdowns = [];
      body.replaceChildren(section(t("events_section_main"), data.main), section(t("events_section_sk"), data.sk));
      tick();
      startTimers();
      status.textContent = updatedText(data.updated);
    } catch (err) {
      body.replaceChildren(errorBox(t("events_error", { message: err.message })));
      status.textContent = t("events_fetch_failed");
    }
  }

  function section(title, rows) {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    rows = (rows || []).filter((r) => Date.parse(r.start) > cutoff);
    const out = [h("h2", {}, title)];
    if (!rows.length) return h("section", {}, out, h("p", { class: "hint" }, t("events_none")));
    const dayFmt = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" });
    let lastDay = "";
    const list = h("div", { class: "events" });
    for (const r of rows) {
      const start = new Date(r.start);
      const day = dayFmt.format(start);
      if (day !== lastDay) { list.append(h("div", { class: "day" }, day)); lastDay = day; }
      const cd = h("span", { class: "cd" });
      const row = h("div", { class: "event" },
        h("div", { class: "when" }, h("b", {}, formatClock(start))),
        h("div", { class: "what" }, h("b", {}, r.name), h("span", {}, r.bonus)),
        cd);
      countdowns.push({ el: cd, row, start: start.getTime() });
      list.append(row);
    }
    out.push(list);
    return h("section", {}, out);
  }

  load_();
}

function renderGifts() {
  const body = h("div");
  const status = liveToolbar(() => load_());
  $view.append(body, credits(GIFTS_URL));

  async function load_() {
    status.textContent = t("events_loading");
    try {
      const data = await fetchJson("data/gifts.json", true);
      body.replaceChildren(...data.sections.map((s) => {
        const key = GIFT_SECTION_KEYS[s.title];
        return h("section", {},
          h("h2", {}, key ? t(key) : s.title),
          h("div", { class: "gifts" }, s.items.map((item) => h("div", { class: "gift" },
            h("div", { class: "gift-title" }, item.title, h("code", {}, item.code)),
            h("div", { class: "gift-links" }, item.links.map(([kind, url]) =>
              h("a", { class: "btn", href: url, target: "_blank", rel: "noopener" }, t(`gifts_link_${kind}`))))))));
      }));
      status.textContent = updatedText(data.updated);
    } catch (err) {
      body.replaceChildren(errorBox(t("events_error", { message: err.message })));
      status.textContent = t("events_fetch_failed");
    }
  }
  load_();
}

function route() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  $view.replaceChildren();

  const [name, sub = ""] = location.hash.replace(/^#\/?/, "").split("/");
  const section = SECTIONS.find((s) => s.route === name);
  $back.hidden = !section;
  $back.setAttribute("aria-label", t("back"));
  $title.textContent = section ? t(section.key) : "BattleForge · " + t("hints_menu");
  document.title = section ? `${t(section.key)} · BattleForge` : `BattleForge · ${t("hints_menu")}`;

  if (section) {
    $view.append(h("h1", { class: "visually-hidden" }, t(section.key)));
    section.render(sub);
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

async function init() {
  try {
    [I18N, STATIC, CAL] = await Promise.all(
      [fetchJson("data/i18n.json"), fetchJson("data/static.json"), fetchJson("data/calendar.json")]);
  } catch (err) {
    $view.replaceChildren(errorBox("Failed to load data: " + err.message));
    return;
  }
  lang = pickLanguage();
  document.documentElement.lang = lang;
  for (const [code, label] of Object.entries(I18N.languages)) {
    $lang.append(h("option", { value: code, selected: code === lang }, label));
  }
  $lang.setAttribute("aria-label", t("language"));
  $lang.addEventListener("change", () => {
    lang = $lang.value;
    save("lang", lang);
    document.documentElement.lang = lang;
    route();
  });
  $back.addEventListener("click", () => { location.hash = "#/"; });
  window.addEventListener("hashchange", route);
  route();
}

init();
