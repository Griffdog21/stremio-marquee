// User configuration: validation, defaults and the compact URL encoding that
// Stremio carries in the addon's install URL (/<config>/manifest.json).
import { THEME_IDS, TEMPLATE_IDS, PALETTE_KEYS, getTheme } from './themes.js';
import { isHex, toBase64Url, fromBase64Url } from './util.js';

export const BUILTIN_ROWS = ['spotlight', 'movies', 'series', 'mood', 'fresh'];
export const DEFAULT_ROWS = ['spotlight', 'movies', 'series', 'mood'];
export const CARD_SHAPES = ['poster', 'landscape', 'square'];
export const LIMITS = { rows: 12, custom: 6, customIds: 60, posters: 60, name: 40, url: 600, minCount: 10, maxCount: 100 };

export const DEFAULTS = Object.freeze({
  title: '', // add-on name shown in Stremio ('' = "Marquee · <theme>")
  theme: 'neon',
  template: null, // null = the theme's own art style
  colors: {}, // palette overrides, e.g. { primary: '#ff00aa' }
  art: 'original', // 'original' = real posters (art only where one is missing), 'art' = theme art on every card
  rows: DEFAULT_ROWS,
  shapes: {}, // per-row card shape overrides
  names: {}, // per-row display names
  prefix: null, // null = theme emoji, '' = none
  logo: '', // custom addon logo URL
  background: '', // custom addon background URL
  posters: {}, // per-title poster overrides: { tt123: 'https://…' }
  custom: [], // custom collections: [{ name, type, ids, shape }]
  count: 40, // items per row
});

const clampStr = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Cut on whole user-perceived characters so emoji sequences never split.
const graphemes = (s) =>
  typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(s)].map((g) => g.segment) : [...s];

/**
 * The normalised form of an http(s) URL, or '' if it isn't one. Normalising
 * percent-encodes quotes and angle brackets, so a URL can never break out of
 * an HTML attribute downstream.
 */
export function cleanUrl(v) {
  if (typeof v !== 'string' || v.length > LIMITS.url) return '';
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

export const isHttpUrl = (v) => cleanUrl(v) !== '';

const isImdb = (v) => typeof v === 'string' && /^tt\d{5,10}$/.test(v);
const rowKey = (id) => BUILTIN_ROWS.includes(id) || /^custom\d$/.test(id);

export function normalizeConfig(input = {}) {
  const src = input && typeof input === 'object' ? input : {};
  const cfg = {};
  cfg.title = clampStr(src.title, LIMITS.name);
  cfg.theme = THEME_IDS.includes(src.theme) ? src.theme : DEFAULTS.theme;
  cfg.template = TEMPLATE_IDS.includes(src.template) ? src.template : null;

  cfg.colors = {};
  for (const k of PALETTE_KEYS) if (isHex(src.colors?.[k])) cfg.colors[k] = src.colors[k].toLowerCase();

  cfg.art = src.art === 'art' ? 'art' : 'original';

  cfg.custom = (Array.isArray(src.custom) ? src.custom : []).slice(0, LIMITS.custom).map((c, i) => ({
    name: clampStr(c?.name, LIMITS.name) || `Collection ${i + 1}`,
    type: c?.type === 'series' ? 'series' : 'movie',
    ids: [...new Set((Array.isArray(c?.ids) ? c.ids : []).filter(isImdb))].slice(0, LIMITS.customIds),
    shape: CARD_SHAPES.includes(c?.shape) ? c.shape : 'poster',
  })).filter((c) => c.ids.length);

  // Without an explicit row list, custom collections follow the defaults.
  const wanted = Array.isArray(src.rows) ? src.rows : [...DEFAULTS.rows, ...cfg.custom.map((_, i) => `custom${i}`)];
  const rows = [];
  for (const id of wanted) {
    if (!rowKey(id) || rows.includes(id)) continue;
    if (/^custom\d$/.test(id) && !cfg.custom[Number(id.slice(6))]) continue;
    rows.push(id);
  }
  cfg.rows = rows.slice(0, LIMITS.rows);

  cfg.shapes = {};
  for (const [k, v] of Object.entries(src.shapes || {})) if (rowKey(k) && CARD_SHAPES.includes(v)) cfg.shapes[k] = v;
  cfg.names = {};
  for (const [k, v] of Object.entries(src.names || {})) {
    const name = clampStr(v, LIMITS.name);
    if (rowKey(k) && name) cfg.names[k] = name;
  }
  cfg.prefix = typeof src.prefix === 'string' ? graphemes(src.prefix.trim()).slice(0, 4).join('') : null;
  cfg.logo = cleanUrl(src.logo);
  cfg.background = cleanUrl(src.background);
  cfg.posters = {};
  for (const [k, v] of Object.entries(src.posters || {}).slice(0, LIMITS.posters)) {
    const url = cleanUrl(v);
    if (isImdb(k) && url) cfg.posters[k] = url;
  }
  const count = parseInt(src.count, 10);
  cfg.count = Number.isFinite(count) ? Math.min(LIMITS.maxCount, Math.max(LIMITS.minCount, count)) : DEFAULTS.count;
  return cfg;
}

// Only what differs from the defaults: keeps install URLs short and preset
// files (presets/*.json) readable.
export function exportConfig(input) {
  const cfg = normalizeConfig(input);
  const out = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (k === 'theme' || JSON.stringify(v) !== JSON.stringify(DEFAULTS[k])) out[k] = v;
  }
  return out;
}

export function encodeConfig(input) {
  return toBase64Url(JSON.stringify(exportConfig(input)));
}

export function decodeConfig(token) {
  try {
    return normalizeConfig(JSON.parse(fromBase64Url(token)));
  } catch {
    return null;
  }
}

export function themeOf(cfg) {
  return getTheme(cfg.theme);
}
