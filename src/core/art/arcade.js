// Pixel Arcade: an 8-bit attract screen with pixel invaders, a starfield, a
// high score made from the rating, and INSERT COIN.
import { n, mix } from '../util.js';
import { linear, title, meta, label, join } from './common.js';

const SPRITES = [
  ['  X     X  ', '   X   X   ', '  XXXXXXX  ', ' XX XXX XX ', 'XXXXXXXXXXX', 'X XXXXXXX X', 'X X     X X', '   XX XX   '],
  ['   XX   ', '  XXXX  ', ' XXXXXX ', 'XX XX XX', 'XXXXXXXX', '  X  X  ', ' X XX X ', 'X X  X X'],
  ['    XXXX    ', ' XXXXXXXXXX ', 'XXXXXXXXXXXX', 'XXX  XX  XXX', 'XXXXXXXXXXXX', '   XX  XX   ', '  XX XX XX  ', 'XX        XX'],
];

function sprite(rows, x, y, px, fill) {
  let s = '';
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (ch === 'X') s += `<rect x="${n(x + i * px)}" y="${n(y + j * px)}" width="${n(px)}" height="${n(px)}"/>`;
    });
  });
  return `<g fill="${fill}">${s}</g>`;
}

export default function arcade(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const colors = [pal.primary, pal.secondary, pal.accent];

  let s = '<defs>';
  s += linear(`${uid}bg`, [[0, pal.bg], [1, pal.surface]]);
  s += `<pattern id="${uid}scan" width="${n(w)}" height="${n(3 * u)}" patternUnits="userSpaceOnUse"><rect width="${n(w)}" height="${n(u)}" fill="#000" fill-opacity="0.3"/></pattern>`;
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}bg)"/>`;
  // Square pixel stars.
  for (let i = 0; i < (wide ? 60 : 40); i++) {
    const sz = r.pick([1.5, 2, 2, 3]) * u;
    s += `<rect x="${n(r.range(0, w))}" y="${n(r.range(0, h))}" width="${n(sz)}" height="${n(sz)}" fill="${r.chance(0.7) ? pal.text : r.pick(colors)}" fill-opacity="${n(r.range(0.35, 1))}"/>`;
  }

  const pad = wide ? w * 0.06 : w * 0.07;
  // HUD across the top.
  const hy = (wide ? 30 : 26) * u;
  const score = m.rating ? String(Math.round(parseFloat(m.rating) * 1000)).padStart(6, '0') : '000000';
  s += label('1UP', { x: pad, y: hy, font: 'pixel', size: 8 * u, attrs: `fill="${pal.accent}"` });
  s += label(m.year || '----', { x: pad, y: hy + 13 * u, font: 'pixel', size: 8 * u, attrs: `fill="${pal.text}"` });
  s += label('HI-SCORE', { x: w / 2, y: hy, font: 'pixel', size: 8 * u, anchor: 'middle', attrs: `fill="${pal.primary}"` });
  s += label(score, { x: w / 2, y: hy + 13 * u, font: 'pixel', size: 8 * u, anchor: 'middle', attrs: `fill="${pal.text}"` });
  s += label('CREDIT 1', { x: w - pad, y: hy, font: 'pixel', size: 7 * u, anchor: 'end', attrs: `fill="${pal.muted}"` });

  // A formation of invaders.
  const px = (wide ? 3.6 : 3.2) * u;
  const cols = 4; // in widescreen the title sits to the right of the formation
  const rowCount = wide ? 2 : 2;
  const gridW = cols * 15 * px;
  const gx = wide ? w * 0.06 : (w - gridW) / 2 + 2 * px;
  const gy = hy + (wide ? 28 : 30) * u;
  for (let j = 0; j < rowCount; j++) {
    const spr = SPRITES[(j + r.int(0, 2)) % SPRITES.length];
    for (let i = 0; i < cols; i++) {
      if (r.chance(0.12)) continue;
      s += sprite(spr, gx + i * 15 * px, gy + j * 11 * px, px, colors[(i + j) % colors.length]);
    }
  }

  // The title, with a hard pixel shadow.
  const box = wide
    ? { x: w * 0.46, y: h * 0.3, w: w * 0.48, h: h * 0.42 }
    : { x: pad, y: h * 0.4, w: w - pad * 2, h: h * 0.3 };
  s += title(c, box, {
    font: 'pixel', maxSize: (wide ? 24 : 22) * u, minSize: 7 * u, lineHeight: 1.45, upper: true, anchor: 'middle', valign: 'center', maxLines: 5,
    layers: [`fill="${pal.primary}" transform="translate(${n(2.5 * u)} ${n(2.5 * u)})"`, `fill="${pal.text}"`],
    subFont: 'pixel', subSize: 7 * u, subTracking: 0, subFill: pal.secondary, subGap: 1.2,
  }).svg;

  // Ground blocks and the call to action.
  const gyb = h - (wide ? 34 : 40) * u;
  const block = 10 * u;
  let ground = '';
  for (let x = 0; x < w; x += block) ground += `<rect x="${n(x + 0.5 * u)}" y="${n(gyb + 0.5 * u)}" width="${n(block - u)}" height="${n(block - u)}"/>`;
  s += `<g fill="${mix(pal.secondary, pal.bg, 0.45)}">${ground}</g>`;
  s += label(join(['INSERT COIN', m.genres[0]], '  ·  ').toUpperCase(), {
    x: w / 2, y: gyb - 12 * u, font: 'pixel', size: 7.5 * u, anchor: 'middle', maxWidth: w - pad * 2, attrs: `fill="${pal.accent}"`,
  });
  s += `<rect x="${n(4 * u)}" y="${n(4 * u)}" width="${n(w - 8 * u)}" height="${n(h - 8 * u)}" fill="none" stroke="${pal.secondary}" stroke-opacity="0.6" stroke-width="${n(2 * u)}" stroke-dasharray="${n(4 * u)} ${n(4 * u)}"/>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}scan)"/>`;
  return s;
}
