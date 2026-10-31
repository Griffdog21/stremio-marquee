// Gilded Age: an art-deco sunburst, stepped gold frames and a lacquered plaque.
import { n, mix, lighten, darken, roman } from '../util.js';
import { linear, title, meta, label, notchedRect, join } from './common.js';

export default function deco(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const gold = `url(#${uid}gold)`;
  const m0 = Math.min(w, h) * 0.04;
  const m1 = m0 + 7 * u;
  const notch = 11 * u;

  let s = '<defs>';
  s += linear(`${uid}gold`, [[0, lighten(pal.primary, 0.6)], [0.45, pal.primary], [0.7, lighten(pal.primary, 0.25)], [1, darken(pal.primary, 0.4)]], { x2: 1, y2: 1 });
  s += linear(`${uid}bg`, [[0, pal.bg], [0.55, pal.surface], [1, pal.bg]]);
  s += `<clipPath id="${uid}in"><rect x="${n(m1)}" y="${n(m1)}" width="${n(w - m1 * 2)}" height="${n(h - m1 * 2)}"/></clipPath>`;
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}bg)"/>`;

  // Sunburst rays radiating from below the plaque.
  const cx = w / 2;
  const cy = wide ? h * 0.97 : h * 0.66;
  const R = Math.hypot(w, h) * 1.1;
  const N = r.pick([32, 36, 40]);
  let rays = '';
  for (let i = 0; i < N; i += 2) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    rays += `<polygon points="${n(cx)},${n(cy)} ${n(cx + R * Math.cos(a0))},${n(cy + R * Math.sin(a0))} ${n(cx + R * Math.cos(a1))},${n(cy + R * Math.sin(a1))}" fill-opacity="${i % 4 ? 0.06 : 0.12}"/>`;
  }
  let rings = '';
  for (const k of [0.16, 0.24, 0.32]) {
    rings += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w, h) * k)}" fill="none" stroke="${pal.primary}" stroke-opacity="0.22" stroke-width="${n(u)}"/>`;
  }
  s += `<g clip-path="url(#${uid}in)"><g fill="${pal.primary}">${rays}</g>${rings}</g>`;

  // Frames.
  s += `<rect x="${n(m0)}" y="${n(m0)}" width="${n(w - m0 * 2)}" height="${n(h - m0 * 2)}" fill="none" stroke="${gold}" stroke-width="${n(1.8 * u)}"/>`;
  s += `<path d="${notchedRect(m1, m1, w - m1 * 2, h - m1 * 2, notch)}" fill="none" stroke="${gold}" stroke-width="${n(u)}"/>`;
  for (const [x, y] of [[m1, m1], [w - m1, m1], [m1, h - m1], [w - m1, h - m1]]) {
    const d = 4 * u;
    s += `<path d="M${n(x)},${n(y - d)}L${n(x + d)},${n(y)}L${n(x)},${n(y + d)}L${n(x - d)},${n(y)}Z" fill="${gold}"/>`;
  }

  // Fan ornament hanging from the top frame.
  const fr = Math.min(w, h) * 0.12;
  const fy = m1;
  let fan = '';
  for (const k of [1, 0.7, 0.42]) {
    fan += `<path d="M${n(cx - fr * k)},${n(fy)}A${n(fr * k)},${n(fr * k)} 0 0 0 ${n(cx + fr * k)},${n(fy)}" fill="none"/>`;
  }
  for (let i = 1; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    fan += `<line x1="${n(cx)}" y1="${n(fy)}" x2="${n(cx + fr * Math.cos(a))}" y2="${n(fy + fr * Math.sin(a))}"/>`;
  }
  s += `<g stroke="${gold}" stroke-width="${n(u)}">${fan}</g>`;
  s += label(join(m.genres, '  ·  '), {
    x: cx, y: fy + fr + 16 * u, font: 'poiret', size: 10.5 * u, upper: true, tracking: 0.38, anchor: 'middle',
    maxWidth: w - m1 * 2 - 20 * u, attrs: `fill="${pal.secondary}"`,
  });

  // Title on a lacquered plaque.
  const plaqueW = wide ? w * 0.62 : w * 0.8;
  const box = wide
    ? { x: cx - plaqueW / 2 + 18 * u, y: h * 0.32, w: plaqueW - 36 * u, h: h * 0.34 }
    : { x: cx - plaqueW / 2 + 16 * u, y: h * 0.36, w: plaqueW - 32 * u, h: h * 0.26 };
  const t = title(c, box, {
    font: 'limelight', maxSize: (wide ? 44 : 36) * u, minSize: 12 * u, lineHeight: 1.08, tracking: 0.04, upper: true,
    anchor: 'middle', valign: 'center', maxLines: 3, layers: [`fill="${gold}"`],
    subFont: 'poiret', subSize: 11 * u, subTracking: 0.25, subFill: pal.secondary,
  });
  const py = t.top - 15 * u;
  const ph = t.bottom - t.top + 30 * u + (c.title.sub ? 4 * u : 0);
  s += `<path d="${notchedRect(cx - plaqueW / 2, py, plaqueW, ph, 8 * u)}" fill="${pal.bg}" fill-opacity="0.9" stroke="${gold}" stroke-width="${n(1.4 * u)}"/>`;
  s += `<path d="${notchedRect(cx - plaqueW / 2 + 4 * u, py + 4 * u, plaqueW - 8 * u, ph - 8 * u, 6 * u)}" fill="none" stroke="${pal.primary}" stroke-opacity="0.5" stroke-width="${n(0.8 * u)}"/>`;
  s += t.svg;

  // Roman-numeral year with ruled flourishes.
  const ry = py + ph + 22 * u;
  const yearText = m.isSeries ? m.yearLabel : roman(m.year) || m.yearLabel;
  if (yearText) {
    s += label(yearText, { x: cx, y: ry, font: 'poiret', size: 13 * u, tracking: 0.35, anchor: 'middle', attrs: `fill="${pal.secondary}"` });
    s += `<g stroke="${gold}" stroke-width="${n(u)}"><line x1="${n(m1 + 18 * u)}" y1="${n(ry - 4 * u)}" x2="${n(cx - 62 * u)}" y2="${n(ry - 4 * u)}"/><line x1="${n(cx + 62 * u)}" y1="${n(ry - 4 * u)}" x2="${n(w - m1 - 18 * u)}" y2="${n(ry - 4 * u)}"/></g>`;
  }

  if (m.rating) {
    const dy = h - m1 - 26 * u;
    const d = 15 * u;
    s += `<path d="M${n(cx)},${n(dy - d)}L${n(cx + d)},${n(dy)}L${n(cx)},${n(dy + d)}L${n(cx - d)},${n(dy)}Z" fill="${mix(pal.bg, pal.surface, 0.5)}" stroke="${gold}" stroke-width="${n(1.2 * u)}"/>`;
    s += label(m.rating, { x: cx, y: dy + 3.8 * u, font: 'barlowSemi', size: 11 * u, anchor: 'middle', attrs: `fill="${pal.secondary}"` });
  }
  return s;
}
