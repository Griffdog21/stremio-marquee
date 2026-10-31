// Turns a configuration into what Stremio actually reads: a manifest and the
// catalog rows. Shared by the static GitHub Pages build and the live server.
import { getTheme } from './themes.js';
import { seedFrom, toBase64Url, fromBase64Url } from './util.js';
import { VERSION } from './version.js';

export const SHAPE_CODES = { poster: 'p', landscape: 'l', square: 's' };
export const SHAPE_FROM_CODE = { p: 'poster', l: 'landscape', s: 'square' };

// Stremio shows rows as "<name> - Movie" / "<name> - Series", so names never
// repeat the type.
export function rowDefs(theme, year = new Date().getFullYear()) {
  return {
    spotlight: {
      type: 'movie', name: theme.collection.name, shape: 'landscape',
      source: { kind: 'collection', id: theme.collection.id },
    },
    movies: {
      type: 'movie', name: 'Trending', shape: 'poster',
      source: { kind: 'cinemeta', type: 'movie', catalog: 'top' },
    },
    series: {
      type: 'series', name: 'Trending', shape: 'poster',
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
 * What makes each add-on's id unique, so several can be installed side by side:
 * stock themes 'haunt', real-poster variants 'haunt.classic', published presets
 * 'preset.<slug>', and live custom setups '<theme>.<hash of config>'.
 */
export function addonKey({ cfg, variant = 'stock', slug = '', token = '' }) {
  const id = getTheme(cfg.theme).id;
  if (variant === 'stock') return id;
  if (variant === 'classic') return `${id}.classic`;
  if (variant === 'preset') return `preset.${slug}`;
  return token ? `${id}.${seedFrom(token).toString(36)}` : `${id}.live`;
}

export function defaultName(cfg, variant = 'stock') {
  const theme = getTheme(cfg.theme);
  if (variant === 'stock') return `Marquee · ${theme.name}`;
  if (variant === 'classic') return `Marquee · ${theme.name} · Real posters`;
  return `Marquee · ${theme.name} (custom)`;
}

/** assetBase: where logo.png and the backdrop live, if not alongside (real-poster twins share them). */
export function buildManifest({ cfg, base, variant = 'stock', slug = '', token = '', ext = 'png', assetBase = base }) {
  const theme = getTheme(cfg.theme);
  const rows = resolveRows(cfg);
  return {
    id: `community.marquee.${addonKey({ cfg, variant, slug, token })}`,
    version: VERSION,
    name: cfg.title || defaultName(cfg, variant),
    description: `${theme.tagline} Marquee re-themes your Stremio home screen with ${cfg.art === 'original' ? 'curated rows, widescreen spotlights and collections' : 'original poster art, widescreen spotlight rows and curated collections'}, on every Stremio app including Google TV and Android TV.`,
    logo: cfg.logo || `${assetBase}/logo.png`,
    background: cfg.background || `${assetBase}/background.${ext}`,
    types: [...new Set(rows.map((r) => r.type))],
    resources: ['catalog'],
    catalogs: rows.map((r) => ({ type: r.type, id: r.catalogId, name: r.title, extra: [] })),
    behaviorHints: { configurable: true, configurationRequired: false },
  };
}

// Cinemeta lists "small" posters; "medium" is noticeably sharper on a TV.
const sharper = (url) => (url ? url.replace('images.metahub.space/poster/small/', 'images.metahub.space/poster/medium/') : url);

export function toMetas({ row, items, cfg, artUrl }) {
  return items.slice(0, cfg.count).map((it) => {
    const shape = row.shape;
    let poster;
    if (cfg.posters[it.id]) poster = cfg.posters[it.id];
    else if (cfg.art === 'original') poster = shape === 'landscape' ? it.background || sharper(it.poster) : sharper(it.poster);
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
