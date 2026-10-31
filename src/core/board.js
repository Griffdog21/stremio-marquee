// A mock of Stremio's home board, drawn in SVG. Used for theme previews on the
// website and in the README, so people can see a theme before installing it.
import { n, esc, mix, rgba, lighten } from './util.js';
import { FONTS } from './fonts.js';
import { artBody, fullPalette } from './art/index.js';
import { measure } from './text.js';

// A card is either generated art or, in the browser Studio, a real image URL
// (original posters and per-title poster swaps).
function card(art, x, y, w, h, radius, clipId, imageUrl) {
  const clip = `<clipPath id="${clipId}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(radius)}"/></clipPath>`;
  if (imageUrl) {
    return `${clip}<g clip-path="url(#${clipId})"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="#222"/><image href="${esc(imageUrl)}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="xMidYMid slice"/></g>`;
  }
  const { body, w: aw, h: ah } = art;
  return `${clip}<g clip-path="url(#${clipId})"><svg x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${aw} ${ah}" preserveAspectRatio="xMidYMid slice">${body}</svg></g>`;
}

/**
 * rows: [{ name, shape: 'poster'|'landscape'|'square', items: [...], imageFor?(item) }]
 * The layout mimics a 1080p TV: a nav rail, a search pill and scrolling rows.
 */
export function renderBoard({ template, palette, rows, width = 1280, height = 720, title = 'Marquee', idPrefix = 'b' }) {
  const p = fullPalette(palette, template);
  const sc = width / 1280;
  const nav = 86 * sc;
  const ui = FONTS.barlowSemi;
  const uiFamily = esc(ui.family);
  let s = `<rect width="${width}" height="${height}" fill="${p.bg}"/>`;
  s += `<rect width="${width}" height="${height}" fill="url(#${idPrefix}glowbg)"/>`;
  const defs = `<defs><radialGradient id="${idPrefix}glowbg" cx="${n(width * 0.8)}" cy="${n(-height * 0.1)}" r="${n(width * 0.8)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.primary}" stop-opacity="0.22"/><stop offset="1" stop-color="${p.primary}" stop-opacity="0"/></radialGradient></defs>`;

  // Navigation rail.
  s += `<rect width="${n(nav)}" height="${height}" fill="${mix(p.bg, p.surface, 0.6)}"/>`;
  const icons = 6;
  for (let i = 0; i < icons; i++) {
    const cy = (110 + i * 74) * sc;
    const active = i === 0;
    if (active) s += `<rect x="${n(nav * 0.22)}" y="${n(cy - 22 * sc)}" width="${n(nav * 0.56)}" height="${n(44 * sc)}" rx="${n(12 * sc)}" fill="${p.primary}" fill-opacity="0.22"/>`;
    s += `<circle cx="${n(nav / 2)}" cy="${n(cy)}" r="${n(9 * sc)}" fill="none" stroke="${active ? p.primary : p.muted}" stroke-width="${n(2.4 * sc)}"/>`;
  }
  s += `<circle cx="${n(nav / 2)}" cy="${n(44 * sc)}" r="${n(17 * sc)}" fill="${p.primary}"/>`;
  s += `<text x="${n(nav / 2)}" y="${n(51 * sc)}" font-family="${esc(FONTS.monoton.family)}" font-size="${n(20 * sc)}" text-anchor="middle" fill="${p.bg}">M</text>`;

  // Search pill.
  const sx = nav + 40 * sc;
  s += `<rect x="${n(sx)}" y="${n(24 * sc)}" width="${n(420 * sc)}" height="${n(42 * sc)}" rx="${n(21 * sc)}" fill="${rgba(p.text, 0.08)}"/>`;
  s += `<text x="${n(sx + 22 * sc)}" y="${n(51 * sc)}" font-family="${uiFamily}" font-weight="${ui.weight}" font-size="${n(16 * sc)}" fill="${p.muted}">Search movies &amp; series</text>`;
  s += `<text x="${n(width - 40 * sc)}" y="${n(52 * sc)}" font-family="${uiFamily}" font-weight="${ui.weight}" font-size="${n(17 * sc)}" text-anchor="end" letter-spacing="${n(2 * sc)}" fill="${p.text}">${esc(title.toUpperCase())}</text>`;

  // Rows.
  let y = 96 * sc;
  let clip = 0;
  for (const row of rows) {
    const wide = row.shape === 'landscape';
    const square = row.shape === 'square';
    const ch = (wide ? 170 : square ? 190 : 236) * sc;
    const cw = wide ? ch / 0.5625 : square ? ch : ch / 1.5;
    const gap = 18 * sc;
    s += `<text x="${n(sx)}" y="${n(y + 20 * sc)}" font-family="${uiFamily}" font-weight="${ui.weight}" font-size="${n(21 * sc)}" fill="${p.text}">${esc(row.name)}</text>`;
    const label = 'SEE ALL';
    s += `<text x="${n(width - 40 * sc)}" y="${n(y + 20 * sc)}" font-family="${uiFamily}" font-weight="${ui.weight}" font-size="${n(13 * sc)}" text-anchor="end" letter-spacing="${n(1.5 * sc)}" fill="${p.primary}">${label}</text>`;
    y += 34 * sc;
    let x = sx;
    for (const item of row.items) {
      if (x > width) break;
      const imageUrl = row.imageFor ? row.imageFor(item) : null;
      const art = imageUrl ? null : artBody({ template, palette: p, item, shape: row.shape || 'poster', idPrefix: `${idPrefix}${clip}` });
      s += card(art, x, y, cw, ch, 10 * sc, `${idPrefix}c${clip++}`, imageUrl);
      x += cw + gap;
    }
    // Focus ring on the first card, like a TV remote selection.
    if (rows.indexOf(row) === 0) {
      s += `<rect x="${n(sx - 4 * sc)}" y="${n(y - 4 * sc)}" width="${n(cw + 8 * sc)}" height="${n(ch + 8 * sc)}" rx="${n(13 * sc)}" fill="none" stroke="${lighten(p.primary, 0.3)}" stroke-width="${n(3 * sc)}"/>`;
    }
    y += ch + 30 * sc;
    if (y > height) break;
  }
  // Fade the bottom edge like a scrolling list.
  s += `<rect y="${n(height - 60 * sc)}" width="${width}" height="${n(60 * sc)}" fill="url(#${idPrefix}fade)"/>`;
  const fade = `<defs><linearGradient id="${idPrefix}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg}" stop-opacity="0"/><stop offset="1" stop-color="${p.bg}"/></linearGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs}${fade}${s}</svg>`;
}

export { measure };
