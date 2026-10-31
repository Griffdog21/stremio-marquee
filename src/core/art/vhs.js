// Rewind VHS: a rental sleeve with rainbow stripes, a hand-labelled sticker and
// tracking glitches.
import { n, lighten } from '../util.js';
import { linear, blur, title, meta, ratingBadge, label, join } from './common.js';

export default function vhs(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const ink = r.pick(['#1d2f78', '#18181c', '#8a1222']);
  const stripeColors = [pal.primary, '#ff8a1c', pal.accent, '#2fd17c', pal.secondary];

  let s = '<defs>';
  s += linear(`${uid}body`, [[0, lighten(pal.bg, 0.09)], [1, pal.bg]]);
  s += linear(`${uid}paper`, [[0, lighten(pal.text, 0.3)], [1, pal.text]]);
  s += blur(`${uid}shadow`, 3 * u);
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}body)"/>`;

  // Rainbow stripes.
  const bt = (wide ? h * 0.045 : h * 0.027);
  const sy = wide ? h * 0.62 : h * 0.7;
  let bands = '';
  stripeColors.forEach((col, i) => {
    bands += `<rect x="${n(-w * 0.4)}" y="${n(sy + (i - 2.5) * bt)}" width="${n(w * 1.8)}" height="${n(bt + 0.5)}" fill="${col}"/>`;
  });
  s += `<g transform="rotate(${wide ? -10 : -16} ${n(w / 2)} ${n(sy)})">${bands}</g>`;

  // Brand strip.
  const pad = wide ? w * 0.045 : w * 0.07;
  const top = wide ? h * 0.08 : h * 0.045;
  s += `<rect x="${n(pad)}" y="${n(top)}" width="${n(44 * u)}" height="${n(19 * u)}" rx="${n(2.5 * u)}" fill="none" stroke="${pal.text}" stroke-width="${n(1.5 * u)}"/>`;
  s += label('VHS', { x: pad + 22 * u, y: top + 14.5 * u, font: 'archivo', size: 12.5 * u, anchor: 'middle', tracking: 0.04, attrs: `fill="${pal.text}"` });
  s += label('HQ', { x: pad + 52 * u, y: top + 15 * u, font: 'vt323', size: 17 * u, attrs: `fill="${pal.accent}"` });
  s += label(m.isSeries ? 'T-180' : 'T-120', { x: w - pad, y: top + 15 * u, font: 'vt323', size: 17 * u, anchor: 'end', attrs: `fill="${pal.muted}"` });

  // The hand-written label.
  const lb = wide
    ? { x: pad, y: h * 0.2, w: w * 0.56, h: h * 0.5 }
    : { x: pad, y: h * 0.13, w: w - pad * 2, h: h * 0.4 };
  s += `<rect x="${n(lb.x + 3 * u)}" y="${n(lb.y + 4 * u)}" width="${n(lb.w)}" height="${n(lb.h)}" rx="${n(3 * u)}" fill="#000" fill-opacity="0.55" filter="url(#${uid}shadow)"/>`;
  s += `<rect x="${n(lb.x)}" y="${n(lb.y)}" width="${n(lb.w)}" height="${n(lb.h)}" rx="${n(3 * u)}" fill="url(#${uid}paper)"/>`;
  let rules = '';
  for (let i = 1; i <= 4; i++) {
    const y = lb.y + (lb.h * i) / 5 + 4 * u;
    rules += `<line x1="${n(lb.x + 6 * u)}" y1="${n(y)}" x2="${n(lb.x + lb.w - 6 * u)}" y2="${n(y)}"/>`;
  }
  s += `<g stroke="#7fa7d6" stroke-opacity="0.55" stroke-width="${n(0.9 * u)}">${rules}</g>`;
  s += `<line x1="${n(lb.x + lb.w * 0.11)}" y1="${n(lb.y + 3 * u)}" x2="${n(lb.x + lb.w * 0.11)}" y2="${n(lb.y + lb.h - 3 * u)}" stroke="#e5484d" stroke-opacity="0.45" stroke-width="${n(0.9 * u)}"/>`;
  s += label('TITLE', { x: lb.x + lb.w * 0.11 + 5 * u, y: lb.y + 12 * u, font: 'vt323', size: 11 * u, attrs: `fill="#8a8578"` });

  // Long titles get a gentler tilt so the corners stay on the sticker.
  const tilt = c.title.main.length > 24 ? 1.5 : 3.5;
  const rot = r.range(-tilt, tilt * 0.6);
  // Marker strokes overhang their advance widths, hence the generous margins.
  const box = { x: lb.x + lb.w * 0.11 + 14 * u, y: lb.y + 20 * u, w: lb.w * 0.89 - 32 * u, h: lb.h - 32 * u };
  const t = title(c, box, {
    font: 'marker', maxSize: (wide ? 44 : 40) * u, minSize: 12 * u, lineHeight: 1.05, anchor: 'middle', valign: 'center',
    maxLines: 4, layers: [`fill="${ink}"`], subFont: 'marker', subSize: 12 * u, subTracking: 0, subUpper: false, subFill: ink,
  });
  s += `<g transform="rotate(${n(rot)} ${n(box.x + box.w / 2)} ${n(box.y + box.h / 2)})">${t.svg}</g>`;

  // Footer: play symbol, year, rating.
  const fy = wide ? h * 0.88 : h * 0.875;
  const tri = 7 * u;
  s += `<path d="M${n(pad)},${n(fy - tri * 1.5)}L${n(pad + tri * 1.3)},${n(fy - tri * 0.8)}L${n(pad)},${n(fy - tri * 0.1)}Z" fill="${pal.text}"/>`;
  s += label('PLAY', { x: pad + tri * 1.9, y: fy, font: 'vt323', size: 19 * u, attrs: `fill="${pal.text}"` });
  s += label(m.yearLabel, { x: pad + 64 * u, y: fy, font: 'vt323', size: 19 * u, attrs: `fill="${pal.accent}"` });
  s += ratingBadge({ x: w - pad, y: fy, text: m.rating, font: 'vt323', size: 19 * u, fill: pal.text, starFill: pal.accent });
  s += label(join(['SP / LP / EP', join(m.genres, ' + ')], '   '), {
    x: pad, y: fy + 15 * u, font: 'vt323', size: 13 * u, upper: true, maxWidth: w - pad * 2, attrs: `fill="${pal.muted}"`,
  });

  // Tracking glitches.
  for (let i = 0; i < r.int(2, 3); i++) {
    const gy = r.range(0.1, 0.95) * h;
    const gh = r.range(1.5, 4) * u;
    s += `<rect x="0" y="${n(gy)}" width="${w}" height="${n(gh)}" fill="${r.pick([pal.primary, pal.secondary, '#ffffff'])}" fill-opacity="${n(r.range(0.12, 0.3))}"/>`;
    s += `<rect x="${n(r.range(-0.2, 0.2) * w)}" y="${n(gy + gh)}" width="${w}" height="${n(gh * 0.5)}" fill="#ffffff" fill-opacity="0.08"/>`;
  }
  return s;
}
