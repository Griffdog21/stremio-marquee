// Entry point for generated art: posters, wide cards, square tiles, addon logos
// and backdrops. Pure string-in/SVG-out, so it runs anywhere.
import { rng, seedFrom, n, lighten, mix, esc } from '../util.js';
import { splitTitle, measure, capHeight } from '../text.js';
import { FONTS } from '../fonts.js';
import { PALETTE_KEYS, getTheme } from '../themes.js';
import { linear, glow, blur } from './common.js';
import neon from './neon.js';
import noir from './noir.js';
import deco from './deco.js';
import vhs from './vhs.js';
import bauhaus from './bauhaus.js';
import terminal from './terminal.js';
import haunt from './haunt.js';
import aurora from './aurora.js';

export const TEMPLATES = { neon, noir, deco, vhs, bauhaus, terminal, haunt, aurora };

// Pixel sizes per Stremio posterShape. Wide matches Stremio's 0.5625 ratio.
export const SHAPES = {
  poster: [300, 450],
  landscape: [640, 360],
  square: [400, 400],
};

export function artItem(item = {}) {
  const rating = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating);
  return {
    id: item.id || '',
    type: item.type || 'movie',
    name: item.name || 'Untitled',
    year: item.year ? String(item.year).slice(0, 4) : '',
    releaseInfo: item.releaseInfo || item.year || '',
    genres: Array.isArray(item.genres) ? item.genres : [],
    rating: Number.isFinite(rating) ? rating : null,
  };
}

export function fullPalette(palette, template) {
  const base = getTheme(template).palette;
  const out = {};
  for (const k of PALETTE_KEYS) out[k] = (palette && palette[k]) || base[k];
  return out;
}

/** Returns the inner SVG markup plus its size, for embedding. */
export function artBody({ template = 'neon', palette, item, shape = 'poster', width, height, idPrefix = '' }) {
  const [dw, dh] = SHAPES[shape] || SHAPES.poster;
  const w = width || dw;
  const h = height || dh;
  const tpl = TEMPLATES[template] || TEMPLATES.neon;
  const it = artItem(item);
  const seed = `${it.id || it.name}|${template}`;
  const ctx = {
    w,
    h,
    wide: w / h > 1.25,
    u: Math.min(w, h) / 300,
    item: it,
    title: splitTitle(it.name),
    pal: fullPalette(palette, template),
    r: rng(seed),
    uid: `${idPrefix}m${seedFrom(`${seed}|${w}x${h}`).toString(36)}`,
  };
  return { body: tpl(ctx), w, h };
}

export function renderArt(opts) {
  const { body, w, h } = artBody(opts);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/** Square addon logo: a marquee sign with chasing bulbs around a neon "M". */
export function renderLogo({ palette, template = 'neon', size = 512, letter = 'M' }) {
  const p = fullPalette(palette, template);
  const u = size / 512;
  const s = size;
  const uid = `lg${seedFrom(JSON.stringify(p)).toString(36)}`;
  let o = '<defs>';
  o += linear(`${uid}bg`, [[0, mix(p.surface, p.bg, 0.2)], [1, p.bg]]);
  o += linear(`${uid}m`, [[0, lighten(p.primary, 0.25)], [1, p.secondary]], { x2: 1, y2: 1 });
  o += glow(`${uid}g`, 10 * u);
  o += blur(`${uid}b`, 6 * u);
  o += '</defs>';
  o += `<rect x="${n(8 * u)}" y="${n(8 * u)}" width="${n(s - 16 * u)}" height="${n(s - 16 * u)}" rx="${n(112 * u)}" fill="url(#${uid}bg)"/>`;
  o += `<rect x="${n(30 * u)}" y="${n(30 * u)}" width="${n(s - 60 * u)}" height="${n(s - 60 * u)}" rx="${n(92 * u)}" fill="none" stroke="${p.primary}" stroke-opacity="0.45" stroke-width="${n(3 * u)}"/>`;
  // Bulbs along the inner edge.
  const inset = 58 * u;
  const per = 6;
  let bulbs = '';
  for (let i = 0; i < per; i++) {
    const t = inset + 52 * u + (i * (s - 2 * inset - 104 * u)) / (per - 1);
    for (const [x, y] of [[t, inset], [t, s - inset], [inset, t], [s - inset, t]]) {
      bulbs += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(9 * u)}"/>`;
    }
  }
  o += `<g fill="${p.accent}" filter="url(#${uid}b)" fill-opacity="0.8">${bulbs}</g><g fill="${lighten(p.accent, 0.55)}">${bulbs}</g>`;
  const size2 = 250 * u;
  const cap = capHeight('monoton', size2);
  o += `<text x="${n(s / 2)}" y="${n(s / 2 + cap / 2)}" font-family="${FONTS.monoton.family}" font-size="${n(size2)}" text-anchor="middle" fill="url(#${uid}m)" filter="url(#${uid}g)">${esc(letter)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${o}</svg>`;
}

/** Wide backdrop for the addon's detail page, drawn in the theme's own style. */
export function renderBackdrop({ template, palette, name, width = 1280, height = 720 }) {
  return renderArt({
    template,
    palette,
    width,
    height,
    item: { id: `marquee-${name}`, name, type: 'movie', genres: ['Marquee', 'Theme'] },
  });
}

export { measure };
