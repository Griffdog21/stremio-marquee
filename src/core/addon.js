// Turns a configuration into what Stremio actually reads: a manifest and the
// catalog rows. Shared by the static GitHub Pages build and the live server.
import { getTheme } from './themes.js';
import { seedFrom, toBase64Url, fromBase64Url } from './util.js';
import { VERSION } from './version.js';

export const SHAPE_CODES = { poster: 'p', landscape: 'l', square: 's' };
export const SHAPE_FROM_CODE = { p: 'poster', l: 'landscape', s: 'square' };

export function rowDefs(theme, year = new Date().getFullYear()) {
  return {
    spotlight: {
      type: 'movie', name: theme.collection.name, shape: 'landscape',
      source: { kind: 'collection', id: theme.collection.id },
    },
    movies: {
      type: 'movie', name: 'Trending Movies', shape: 'poster',
      source: { kind: 'cinemeta', type: 'movie', catalog: 'top' },
    },
    series: {
      type: 'series', name: 'Trending Series', shape: 'poster',
      source: { kind: 'cinemeta', type: 'series', catalog: 'top' },
    },
    mood: {
      type: theme.mood.type, name: theme.mood.name, shape: 'poster',
      source: { kind: 'cinemeta', type: theme.mood.type, catalog: 'top', genre: theme.mood.genre },
    },
    fresh: {
      type: 'movie', name: `New in ${year}`, shape: 'poster',
      source: { kind: 'cinemeta', type: 'movie', catalog: 'year', genre: String(year) },
    },
  };
}

export function resolveRows(cfg) {
  const theme = getTheme(cfg.theme);
  const defs = rowDefs(theme);
  const prefix = cfg.prefix ?? theme.emoji;
  return cfg.rows.map((id) => {
    let def;
    if (id.startsWith('custom')) {
      const c = cfg.custom[Number(id.slice(6))];
      def = { type: c.type, name: c.name, shape: c.shape, source: { kind: 'ids', type: c.type, ids: c.ids } };
    } else {
      def = defs[id];
    }
    const name = cfg.names[id] || def.name;
    return {
      ...def,
      id,
      name,
      shape: cfg.shapes[id] || def.shape,
      title: prefix ? `${prefix} ${name}` : name,
      catalogId: `mq-${id}`,
    };
  });
}

/**
 * preset: true for the ready-made themes hosted on GitHub Pages. Custom
 * configurations get their own id so several can be installed side by side.
 */
export function buildManifest({ cfg, base, preset = false, token = '', ext = 'png' }) {
  const theme = getTheme(cfg.theme);
  const rows = resolveRows(cfg);
  return {
    id: preset ? `community.marquee.${theme.id}` : `community.marquee.${theme.id}.${seedFrom(token).toString(36)}`,
    version: VERSION,
    name: preset ? `Marquee · ${theme.name}` : `Marquee · ${theme.name} (custom)`,
    description: `${theme.tagline} Marquee re-themes your Stremio home screen with original poster art, widescreen spotlight rows and curated collections, on every Stremio app including Google TV and Android TV.`,
    logo: cfg.logo || `${base}/logo.png`,
    background: cfg.background || `${base}/background.${ext}`,
    types: [...new Set(rows.map((r) => r.type))],
    resources: ['catalog'],
    catalogs: rows.map((r) => ({ type: r.type, id: r.catalogId, name: r.title, extra: [] })),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

export function toMetas({ row, items, cfg, artUrl }) {
  return items.slice(0, cfg.count).map((it) => {
    const shape = row.shape;
    let poster;
    if (cfg.posters[it.id]) poster = cfg.posters[it.id];
    else if (cfg.art === 'original') poster = shape === 'landscape' ? it.background || it.poster : it.poster;
    else poster = artUrl(it, shape);
    const m = { id: it.id, type: it.type || row.type, name: it.name, poster, posterShape: shape };
    if (it.background) m.background = it.background;
    if (it.logo) m.logo = it.logo;
    if (it.description) m.description = it.description;
    if (it.releaseInfo || it.year) m.releaseInfo = String(it.releaseInfo || it.year);
    if (typeof it.rating === 'number') m.imdbRating = it.rating.toFixed(1);
    if (it.genres?.length) m.genres = it.genres;
    return m;
  });
}

// Everything the art needs travels in the URL, so the server is stateless.
export function artToken(it) {
  return toBase64Url(JSON.stringify([
    it.id, it.name, it.year || '', it.releaseInfo || '', (it.genres || []).slice(0, 2), it.rating ?? null, it.type || 'movie',
  ]));
}

export function parseArtToken(token) {
  const [id, name, year, releaseInfo, genres, rating, type] = JSON.parse(fromBase64Url(token));
  if (typeof name !== 'string') throw new Error('bad art token');
  return { id: String(id || ''), name, year, releaseInfo, genres: Array.isArray(genres) ? genres : [], rating, type };
}
