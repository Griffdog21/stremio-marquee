// Bauhaus: a seeded grid of primary-colour geometry over warm paper, with
// heavy lowercase type.
import { n } from '../util.js';
import { title, meta, label, join, measure } from './common.js';

const SHAPES = [
  ['circle', 2], ['half', 3], ['quarter', 3], ['square', 1.2], ['triangle', 2], ['ring', 1], ['bars', 1], ['blank', 1.4],
];

function pickWeighted(r) {
  const total = SHAPES.reduce((a, [, wt]) => a + wt, 0);
  let x = r.next() * total;
  for (const [name, wt] of SHAPES) {
    x -= wt;
    if (x <= 0) return name;
  }
  return 'circle';
}

function shape(kind, x, y, s, fill, rot, bg) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const t = rot ? ` transform="rotate(${rot} ${n(cx)} ${n(cy)})"` : '';
  switch (kind) {
    case 'circle':
      return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(s * 0.46)}" fill="${fill}"/>`;
    case 'half':
      return `<path d="M${n(x)},${n(y + s)}A${n(s / 2)},${n(s / 2)} 0 0 1 ${n(x + s)},${n(y + s)}Z" fill="${fill}"${t}/>`;
    case 'quarter':
      return `<path d="M${n(x)},${n(y)}L${n(x + s)},${n(y)}A${n(s)},${n(s)} 0 0 1 ${n(x)},${n(y + s)}Z" fill="${fill}"${t}/>`;
    case 'square':
      return `<rect x="${n(x + s * 0.06)}" y="${n(y + s * 0.06)}" width="${n(s * 0.88)}" height="${n(s * 0.88)}" fill="${fill}"${t}/>`;
    case 'triangle':
      return `<path d="M${n(x)},${n(y + s)}L${n(x + s)},${n(y + s)}L${n(x)},${n(y)}Z" fill="${fill}"${t}/>`;
    case 'ring':
      return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(s * 0.34)}" fill="none" stroke="${fill}" stroke-width="${n(s * 0.16)}"/>`;
    case 'bars': {
      let b = '';
      for (let i = 0; i < 3; i++) b += `<rect x="${n(x)}" y="${n(y + s * (0.08 + i * 0.32))}" width="${n(s)}" height="${n(s * 0.18)}" fill="${fill}"/>`;
      return `<g${t}>${b}</g>`;
    }
    default:
      return '';
  }
}

export default function bauhaus(c) {
  const { w, h, u, pal, r, wide } = c;
  const m = meta(c.item);
  const ink = pal.text;
  const colors = r.shuffle([pal.primary, pal.secondary, pal.accent, ink]);

  let s = `<rect width="${w}" height="${h}" fill="${pal.bg}"/>`;
  const area = wide
    ? { x: w * 0.54, y: h * 0.1, w: w * 0.4, h: h * 0.8 }
    : { x: w * 0.07, y: h * 0.055, w: w * 0.86, h: h * 0.56 };
  const cols = 3;
  const rows = 3;
  const cell = Math.min(area.w / cols, area.h / rows);
  const gx = area.x + (area.w - cell * cols) / 2;
  const gy = area.y + (area.h - cell * rows) / 2;

  // One oversized circle anchors the composition.
  if (r.chance(0.6)) {
    const bx = gx + cell * r.int(1, 2);
    const by = gy + cell * r.int(1, 2);
    s += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(cell * r.range(0.85, 1.15))}" fill="${pal.surface}"/>`;
  }
  let i = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const kind = pickWeighted(r);
      const fill = colors[(i + row) % colors.length];
      s += shape(kind, gx + col * cell, gy + row * cell, cell, fill, 90 * r.int(0, 3), pal.bg);
      i++;
    }
  }
  const lineAt = gy + cell * r.int(1, rows - 1);
  s += `<line x1="${n(gx - 6 * u)}" y1="${n(lineAt)}" x2="${n(gx + cell * cols + 6 * u)}" y2="${n(lineAt)}" stroke="${ink}" stroke-width="${n(2.4 * u)}"/>`;
  const colAt = gx + cell * r.int(1, cols - 1);
  s += `<line x1="${n(colAt)}" y1="${n(gy - 6 * u)}" x2="${n(colAt)}" y2="${n(gy + cell * rows + 6 * u)}" stroke="${ink}" stroke-width="${n(1.2 * u)}"/>`;

  const pad = wide ? w * 0.06 : w * 0.07;
  const box = wide
    ? { x: pad, y: h * 0.16, w: w * 0.44, h: h * 0.58 }
    : { x: pad, y: h * 0.655, w: w - pad * 2, h: h * 0.215 };
  s += title(c, box, {
    font: 'archivo', maxSize: (wide ? 48 : 44) * u, minSize: 12 * u, lineHeight: 0.98, tracking: -0.01, lower: true,
    valign: wide ? 'center' : 'top', maxLines: wide ? 4 : 3, layers: [`fill="${ink}"`],
    subFont: 'mono', subSize: 9.5 * u, subTracking: 0.04, subUpper: false, subFill: pal.muted,
  }).svg;

  const by = wide ? h * 0.9 : h * 0.948;
  s += `<line x1="${n(pad)}" y1="${n(by - 15 * u)}" x2="${n(wide ? w * 0.5 : w - pad)}" y2="${n(by - 15 * u)}" stroke="${ink}" stroke-width="${n(1.5 * u)}"/>`;
  s += label(m.yearLabel, { x: pad, y: by, font: 'monoBold', size: 11 * u, attrs: `fill="${ink}"` });
  const gx2 = pad + (m.yearLabel ? measure('monoBold', m.yearLabel, 11 * u) + 12 * u : 0);
  s += label(join(m.genres.map((g) => g.toLowerCase()), ' / '), {
    x: gx2, y: by, font: 'mono', size: 9.5 * u, maxWidth: (wide ? w * 0.5 : w - pad) - gx2 - 36 * u, attrs: `fill="${pal.muted}"`,
  });
  if (m.rating) {
    const rx = (wide ? w * 0.5 : w - pad) - 15 * u;
    s += `<circle cx="${n(rx)}" cy="${n(by - 3.5 * u)}" r="${n(15 * u)}" fill="${pal.primary}"/>`;
    s += label(m.rating, { x: rx, y: by, font: 'archivo', size: 10.5 * u, anchor: 'middle', attrs: `fill="${pal.bg}"` });
  }
  return s;
}
