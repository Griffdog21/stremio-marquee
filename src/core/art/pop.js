// Comic Pop: a halftone panel with speed lines, an explosion burst behind the
// title, a caption box and the rating in a speech bubble.
import { n, lighten, darken } from '../util.js';
import { title, meta, label, join } from './common.js';

const INK = '#111111';

function burst(cx, cy, outer, inner, spikes, r) {
  let d = '';
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 ? inner * r.range(0.9, 1.05) : outer * r.range(0.85, 1.08);
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    d += `${i ? 'L' : 'M'}${n(cx + rad * Math.cos(a))},${n(cy + rad * Math.sin(a))}`;
  }
  return `${d}Z`;
}

export default function pop(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const gut = 7 * u;
  const panel = { x: gut, y: gut, w: w - gut * 2, h: h - gut * 2 };

  let s = '<defs>';
  s += `<pattern id="${uid}dots" width="${n(7 * u)}" height="${n(7 * u)}" patternUnits="userSpaceOnUse"><circle cx="${n(3.5 * u)}" cy="${n(3.5 * u)}" r="${n(1.5 * u)}" fill="${darken(pal.primary, 0.14)}"/></pattern>`;
  s += `<clipPath id="${uid}panel"><rect x="${n(panel.x)}" y="${n(panel.y)}" width="${n(panel.w)}" height="${n(panel.h)}"/></clipPath>`;
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="${pal.bg}"/>`;

  const cx = wide ? w * 0.4 : w / 2;
  const cy = wide ? h * 0.5 : h * 0.48;
  let inside = `<rect x="${n(panel.x)}" y="${n(panel.y)}" width="${n(panel.w)}" height="${n(panel.h)}" fill="${pal.primary}"/>`;
  inside += `<rect x="${n(panel.x)}" y="${n(panel.y)}" width="${n(panel.w)}" height="${n(panel.h)}" fill="url(#${uid}dots)"/>`;
  // Speed lines radiating from the burst.
  const R = Math.hypot(w, h);
  let rays = '';
  for (let i = 0; i < 28; i += 2) {
    const a0 = (i / 28) * Math.PI * 2;
    const a1 = ((i + 0.55) / 28) * Math.PI * 2;
    rays += `<polygon points="${n(cx)},${n(cy)} ${n(cx + R * Math.cos(a0))},${n(cy + R * Math.sin(a0))} ${n(cx + R * Math.cos(a1))},${n(cy + R * Math.sin(a1))}"/>`;
  }
  inside += `<g fill="${lighten(pal.primary, 0.55)}" fill-opacity="0.55">${rays}</g>`;
  const outer = Math.min(w, h) * (wide ? 0.46 : 0.44);
  inside += `<path d="${burst(cx, cy, outer, outer * 0.72, 14, r)}" fill="${pal.secondary}" stroke="${INK}" stroke-width="${n(3 * u)}" stroke-linejoin="round"/>`;
  inside += `<path d="${burst(cx, cy, outer * 0.78, outer * 0.6, 12, r)}" fill="${lighten(pal.secondary, 0.18)}"/>`;
  s += `<g clip-path="url(#${uid}panel)">${inside}</g>`;
  s += `<rect x="${n(panel.x)}" y="${n(panel.y)}" width="${n(panel.w)}" height="${n(panel.h)}" fill="none" stroke="${INK}" stroke-width="${n(3.5 * u)}"/>`;

  // The title, punched out in white with a heavy outline and drop shadow.
  const tw = outer * 1.5;
  const rot = r.range(-6, -2);
  const t = title(c, { x: cx - tw / 2, y: cy - outer * 0.52, w: tw, h: outer * 1.04 }, {
    font: 'bangers', maxSize: (wide ? 56 : 52) * u, minSize: 14 * u, lineHeight: 0.98, tracking: 0.03, upper: true,
    anchor: 'middle', valign: 'center', maxLines: 4,
    layers: [
      `fill="${INK}" transform="translate(${n(3 * u)} ${n(3.5 * u)})"`,
      `fill="#ffffff" stroke="${INK}" stroke-width="${n(3.2 * u)}" stroke-linejoin="round" paint-order="stroke"`,
    ],
    subFont: 'bangers', subSize: 14 * u, subTracking: 0.05, subFill: INK,
  });
  s += `<g transform="rotate(${n(rot)} ${n(cx)} ${n(cy)})">${t.svg}</g>`;

  // Caption box with year and genres.
  const cap = join([m.yearLabel, ...m.genres], ' · ').toUpperCase();
  if (cap) {
    const bw = Math.min(panel.w * (wide ? 0.4 : 0.66), (cap.length * 7.5 + 18) * u);
    s += `<rect x="${n(panel.x + 6 * u)}" y="${n(panel.y + 6 * u)}" width="${n(bw)}" height="${n(24 * u)}" fill="${pal.accent}" stroke="${INK}" stroke-width="${n(2 * u)}"/>`;
    s += label(cap, { x: panel.x + 14 * u, y: panel.y + 23 * u, font: 'bangers', size: 15 * u, tracking: 0.04, maxWidth: bw - 16 * u, attrs: `fill="${INK}"` });
  }

  // Speech bubble with the rating.
  const say = m.rating ? `${m.rating}!` : 'WOW!';
  const bx = wide ? w * 0.82 : w * 0.7;
  const by = wide ? h * 0.72 : h * 0.86;
  const brx = (wide ? 52 : 44) * u;
  const bry = (wide ? 30 : 24) * u;
  s += `<path d="M${n(bx - brx * 0.5)},${n(by - bry * 0.6)}L${n(bx - brx * 1.05)},${n(by - bry * 1.6)}L${n(bx - brx * 0.1)},${n(by - bry * 0.9)}Z" fill="#ffffff" stroke="${INK}" stroke-width="${n(2.4 * u)}" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(brx)}" ry="${n(bry)}" fill="#ffffff" stroke="${INK}" stroke-width="${n(2.4 * u)}"/>`;
  s += `<ellipse cx="${n(bx - brx * 0.42)}" cy="${n(by - bry * 0.55)}" rx="${n(brx * 0.3)}" ry="${n(bry * 0.28)}" fill="#ffffff"/>`;
  s += label(say, { x: bx, y: by + 8 * u, font: 'bangers', size: (wide ? 26 : 22) * u, anchor: 'middle', maxWidth: brx * 1.6, attrs: `fill="${INK}"` });
  return s;
}
