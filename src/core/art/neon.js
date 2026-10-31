// Midnight Neon: a striped synthwave sun over a glowing laser grid.
import { n, mix, darken, lighten } from '../util.js';
import { linear, glow, blur, stars, title, meta, ratingBadge, label, join, measure } from './common.js';

export default function neon(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const swap = r.chance(0.3);
  const A = swap ? pal.secondary : pal.primary; // sun + title glow
  const B = swap ? pal.primary : pal.secondary; // grid
  const horizon = h * (wide ? 0.66 : 0.62);
  const sunR = wide ? h * 0.33 : Math.min(w * 0.31, h * 0.21);
  const sunCx = wide ? w * r.range(0.68, 0.78) : w * r.range(0.4, 0.6);
  const sunCy = horizon - sunR * 0.4;
  const vx = wide ? w * 0.55 : sunCx;

  let stripes = '';
  for (let i = 0; i < 6; i++) {
    const y = sunCy - sunR * (0.22 - i * 0.14);
    stripes += `<rect x="${n(sunCx - sunR - 2)}" y="${n(y)}" width="${n(sunR * 2 + 4)}" height="${n(sunR * (0.03 + i * 0.024))}" fill="#000"/>`;
  }

  let s = '<defs>';
  s += linear(`${uid}sky`, [[0, pal.bg], [0.6, mix(pal.surface, pal.bg, 0.25)], [1, mix(pal.surface, A, 0.45)]]);
  s += linear(`${uid}sun`, [[0, pal.accent], [0.5, mix(pal.accent, A, 0.55)], [1, A]]);
  s += linear(`${uid}floor`, [[0, mix(pal.bg, A, 0.2)], [1, pal.bg]]);
  s += linear(`${uid}fade`, [[0, pal.bg, 0], [1, pal.bg, 0.9]]);
  s += glow(`${uid}glow`, 2 * u);
  s += blur(`${uid}soft`, 16 * u);
  s += blur(`${uid}halo`, 4.5 * u);
  s += `<mask id="${uid}sm"><rect width="${w}" height="${h}" fill="#fff"/>${stripes}</mask>`;
  s += '</defs>';

  s += `<rect width="${w}" height="${h}" fill="url(#${uid}sky)"/>`;
  s += stars(c, wide ? 55 : 36, { y1: horizon * 0.85, color: pal.text });

  // Sun with its glow, then the mountain range in front of it.
  s += `<circle cx="${n(sunCx)}" cy="${n(sunCy)}" r="${n(sunR * 1.15)}" fill="${A}" fill-opacity="0.4" filter="url(#${uid}soft)"/>`;
  s += `<circle cx="${n(sunCx)}" cy="${n(sunCy)}" r="${n(sunR)}" fill="url(#${uid}sun)" mask="url(#${uid}sm)"/>`;
  const peaks = [];
  const count = wide ? 10 : 6;
  for (let i = 0; i <= count; i++) {
    const hgt = (i % 2 ? r.range(0.05, 0.11) : r.range(0.01, 0.04)) * h;
    peaks.push(`${n((i / count) * w)},${n(horizon - hgt)}`);
  }
  s += `<polygon points="0,${n(horizon)} ${peaks.join(' ')} ${w},${n(horizon)}" fill="${darken(pal.surface, 0.4)}" stroke="${B}" stroke-opacity="0.75" stroke-width="${n(1.1 * u)}" stroke-linejoin="round"/>`;

  // Perspective grid floor.
  s += `<rect x="0" y="${n(horizon)}" width="${w}" height="${n(h - horizon)}" fill="url(#${uid}floor)"/>`;
  let grid = '';
  const rows = wide ? 9 : 11;
  for (let i = 1; i <= rows; i++) {
    const t = i / rows;
    const y = horizon + (h - horizon) * t ** 2.1;
    grid += `<line x1="0" y1="${n(y)}" x2="${w}" y2="${n(y)}" stroke-opacity="${n(0.25 + 0.65 * t)}" stroke-width="${n((0.6 + 1.3 * t) * u)}"/>`;
  }
  const cols = wide ? 16 : 10;
  const spread = w * (wide ? 0.085 : 0.14);
  for (let k = -cols; k <= cols; k++) {
    grid += `<line x1="${n(vx + k * w * 0.012)}" y1="${n(horizon)}" x2="${n(vx + k * spread)}" y2="${h}" stroke-opacity="0.75" stroke-width="${n(u)}"/>`;
  }
  s += `<g stroke="${B}" filter="url(#${uid}glow)">${grid}</g>`;
  s += `<line x1="0" y1="${n(horizon)}" x2="${w}" y2="${n(horizon)}" stroke="${lighten(A, 0.3)}" stroke-width="${n(1.6 * u)}" filter="url(#${uid}glow)"/>`;

  // Text.
  const pad = wide ? w * 0.055 : w * 0.08;
  const metaY = wide ? h * 0.13 : h * 0.065;
  const box = wide
    ? { x: pad, y: h * 0.19, w: w * 0.5, h: horizon - h * 0.19 - 14 * u }
    : { x: pad, y: h * 0.1, w: w - pad * 2, h: sunCy - sunR - h * 0.1 - 6 * u };
  const t = title(c, box, {
    font: 'bebas', maxSize: (wide ? 74 : 66) * u, minSize: 16 * u, lineHeight: 0.9, tracking: 0.02, upper: true,
    anchor: wide ? 'start' : 'middle', valign: wide ? 'center' : 'bottom', maxLines: 3,
    layers: [`fill="${A}" filter="url(#${uid}halo)" fill-opacity="0.95"`, `fill="${lighten(A, 0.82)}"`],
    subFont: 'mono', subSize: 9.5 * u, subTracking: 0.12, subFill: B,
  });
  s += t.svg;

  s += label(m.yearLabel, { x: pad, y: metaY, font: 'monoBold', size: 10 * u, attrs: `fill="${B}"` });
  const afterYear = pad + (m.yearLabel ? measure('monoBold', m.yearLabel, 10 * u) + 14 * u : 0);
  s += ratingBadge({
    x: wide ? afterYear : w - pad, y: metaY, text: m.rating, font: 'monoBold', size: 10 * u,
    fill: pal.accent, starFill: pal.accent, anchor: wide ? 'start' : 'end',
  });

  const bandH = h * (wide ? 0.2 : 0.13);
  s += `<rect x="0" y="${n(h - bandH)}" width="${w}" height="${n(bandH)}" fill="url(#${uid}fade)"/>`;
  s += label(join(m.genres, '  /  '), {
    x: wide ? pad : w / 2, y: h - h * (wide ? 0.07 : 0.04), font: 'mono', size: 9 * u, upper: true, tracking: 0.1,
    maxWidth: w - pad * 2, anchor: wide ? 'start' : 'middle', attrs: `fill="${pal.text}" fill-opacity="0.85"`,
  });
  return s;
}
