// Phosphor: a green-screen CRT boot sequence with scanlines.
import { n } from '../util.js';
import { radial, glow, title, meta, label } from './common.js';

export default function terminal(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const fg = pal.primary;

  let s = '<defs>';
  s += radial(`${uid}crt`, [[0, fg, 0.16], [0.6, fg, 0.04], [1, fg, 0]], { cx: w / 2, cy: h / 2, r: Math.max(w, h) * 0.75 });
  s += radial(`${uid}vig`, [[0, '#000', 0], [0.7, '#000', 0.12], [1, '#000', 0.7]], { cx: w / 2, cy: h / 2, r: Math.hypot(w, h) / 2 });
  s += glow(`${uid}glow`, 1.4 * u);
  s += `<pattern id="${uid}scan" width="${n(w)}" height="${n(3 * u)}" patternUnits="userSpaceOnUse"><rect width="${n(w)}" height="${n(1.1 * u)}" fill="#000" fill-opacity="0.45"/></pattern>`;
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="${pal.bg}"/><rect width="${w}" height="${h}" fill="url(#${uid}crt)"/>`;
  const fx = w * 0.04;
  const fyy = h * 0.03;
  s += `<rect x="${n(fx)}" y="${n(fyy)}" width="${n(w - fx * 2)}" height="${n(h - fyy * 2)}" rx="${n(14 * u)}" fill="none" stroke="${fg}" stroke-opacity="0.3" stroke-width="${n(1.2 * u)}"/>`;

  const pad = wide ? w * 0.07 : w * 0.09;
  const right = wide ? w * 0.56 : w - pad;
  let g = '';
  const hy = wide ? h * 0.15 : h * 0.085;
  g += label('MARQUEE//OS', { x: pad, y: hy, font: 'vt323', size: 15 * u, attrs: `fill="${fg}"` });
  g += label(r.pick(['READY', 'ONLINE', 'v2.6', 'MEM OK']), { x: wide ? w - pad : right, y: hy, font: 'vt323', size: 15 * u, anchor: 'end', attrs: `fill="${pal.muted}"` });
  g += `<line x1="${n(pad)}" y1="${n(hy + 6 * u)}" x2="${n(wide ? w - pad : right)}" y2="${n(hy + 6 * u)}" stroke="${fg}" stroke-opacity="0.6" stroke-width="${n(u)}"/>`;
  const cy = hy + 26 * u;
  g += label(`> LOAD ${c.item.id || 'TAPE'}`, { x: pad, y: cy, font: 'vt323', size: 15 * u, attrs: `fill="${pal.secondary}"` });

  const box = wide
    ? { x: pad, y: cy + 14 * u, w: right - pad, h: h * 0.82 - cy - 14 * u - 30 * u }
    : { x: pad, y: cy + 14 * u, w: right - pad, h: h * 0.33 };
  const t = title(c, box, {
    font: 'vt323', maxSize: (wide ? 70 : 64) * u, minSize: 15 * u, lineHeight: 0.86, upper: true, valign: 'top', maxLines: 4,
    layers: [`fill="${pal.text}"`], subFont: 'vt323', subSize: 15 * u, subTracking: 0.04, subFill: pal.accent,
  });
  g += t.svg;

  // Loading bar sized by the rating.
  const blocks = 14;
  const filled = m.rating ? Math.round((parseFloat(m.rating) / 10) * blocks) : blocks;
  const bw = (right - pad) / blocks;
  const barY = t.bottom + 12 * u;
  for (let i = 0; i < blocks; i++) {
    g += `<rect x="${n(pad + i * bw)}" y="${n(barY)}" width="${n(bw - 2.2 * u)}" height="${n(9 * u)}" fill="${fg}" fill-opacity="${i < filled ? 0.95 : 0.18}"/>`;
  }

  const rows = [
    ['YEAR', m.yearLabel],
    ['GENRE', m.genres.join('/')],
    ['RATING', m.rating ? `${m.rating}/10` : 'N/A'],
  ].filter(([, v]) => v);
  const infoX = wide ? w * 0.62 : pad;
  const infoW = wide ? w - pad - infoX : right - pad;
  const lineH = 19 * u;
  const infoTop = wide ? h * 0.36 : h * 0.79 - (rows.length - 1) * lineH;
  rows.forEach(([k, v], i) => {
    const dots = '.'.repeat(Math.max(2, 9 - k.length));
    g += label(`${k}${dots} ${String(v).toUpperCase()}`, { x: infoX, y: infoTop + i * lineH, font: 'vt323', size: 17 * u, maxWidth: infoW, attrs: `fill="${fg}"` });
  });
  const py = wide ? h * 0.86 : h * 0.915;
  g += label('> PLAY', { x: pad, y: py, font: 'vt323', size: 19 * u, attrs: `fill="${pal.text}"` });
  g += `<rect x="${n(pad + 50 * u)}" y="${n(py - 13 * u)}" width="${n(9 * u)}" height="${n(14 * u)}" fill="${pal.text}"/>`;

  s += `<g filter="url(#${uid}glow)">${g}</g>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}scan)"/><rect width="${w}" height="${h}" fill="url(#${uid}vig)"/>`;
  return s;
}
