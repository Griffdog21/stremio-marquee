// Film Noir: hard light through venetian blinds, a silhouette or a curl of
// smoke, and a single red accent.
import { n, mix } from '../util.js';
import { radial, blur, title, meta, ratingBadge, label, join } from './common.js';

// A trench-coated figure in a fedora, drawn in a 100 x 200 box.
const FIGURE =
  'M50,22C57,22 61,25 62,31L63.5,42L71,44C74,45 74,48 70.5,48.5L62,49.5C61,57 58,64 56,67L57,74' +
  'C66,76 74,80 78,88L83,120L86,200L14,200L17,120L22,88C26,80 34,76 43,74L44,67C42,64 39,57 38,49.5' +
  'L29.5,48.5C26,48 26,45 29,44L36.5,42L38,31C39,25 43,22 50,22Z';

export default function noir(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const fromLeft = wide ? false : r.chance(0.5);
  const lx = fromLeft ? w * 0.1 : w * 0.9;

  // The patch of window light, thrown across the wall.
  const quad = fromLeft
    ? [[w * 0.0, h * 0.06], [w * 0.7, h * -0.02], [w * 1.02, h * 0.56], [w * 0.22, h * 0.8]]
    : [[w * 1.0, h * 0.06], [w * 0.3, h * -0.02], [w * -0.02, h * 0.56], [w * 0.78, h * 0.8]];
  const wq = wide
    ? [[w * 0.42, h * -0.05], [w * 1.05, h * -0.05], [w * 1.05, h * 1.05], [w * 0.6, h * 1.05]]
    : quad;

  let s = '<defs>';
  s += radial(`${uid}pool`, [[0, pal.primary, 0.3], [0.45, pal.primary, 0.09], [1, pal.primary, 0]], {
    cx: wide ? w * 0.78 : lx, cy: h * (wide ? 0.4 : 0.32), r: Math.max(w, h) * 0.78,
  });
  s += blur(`${uid}soft`, 1.6 * u, { w, h });
  s += blur(`${uid}smoke`, 5 * u, { w, h });
  s += `<clipPath id="${uid}win"><polygon points="${wq.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}"/></clipPath>`;
  s += '</defs>';

  s += `<rect width="${w}" height="${h}" fill="${pal.bg}"/>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}pool)"/>`;

  let slats = '';
  const pitch = h * (wide ? 0.11 : 0.075);
  for (let i = -4; i < 18; i++) {
    slats += `<rect x="${n(-w * 0.4)}" y="${n(i * pitch)}" width="${n(w * 1.8)}" height="${n(pitch * 0.48)}"/>`;
  }
  const angle = fromLeft ? 21 : -21;
  s += `<g clip-path="url(#${uid}win)" filter="url(#${uid}soft)"><g transform="rotate(${wide ? -14 : angle} ${n(w / 2)} ${n(h / 2)})" fill="${pal.primary}" fill-opacity="0.15">${slats}</g></g>`;

  if (r.chance(0.6)) {
    const fh = wide ? h * 0.92 : h * 0.52;
    const sc = fh / 200;
    const fx = wide ? w * 0.7 : fromLeft ? w * 0.56 : w * 0.06;
    const fy = h - fh + 2 * u;
    s += `<g transform="translate(${n(fx)} ${n(fy)}) scale(${n(sc)})"><path d="${FIGURE}" fill="#000" fill-opacity="0.94"/><path d="${FIGURE}" fill="none" stroke="${pal.primary}" stroke-opacity="0.22" stroke-width="${n(1.1 / sc * u)}"/></g>`;
  } else {
    for (let i = 0; i < 3; i++) {
      const x0 = (wide ? w * 0.75 : w * 0.5) + r.range(-0.12, 0.12) * w;
      const amp = r.range(0.06, 0.14) * w;
      const d = `M${n(x0)},${n(h)}C${n(x0 - amp)},${n(h * 0.75)} ${n(x0 + amp)},${n(h * 0.55)} ${n(x0 - amp * 0.4)},${n(h * 0.32)}S${n(x0 + amp)},${n(h * 0.1)} ${n(x0 + amp * 0.2)},${n(-h * 0.05)}`;
      s += `<path d="${d}" fill="none" stroke="${pal.primary}" stroke-opacity="${n(r.range(0.08, 0.16))}" stroke-width="${n(r.range(5, 12) * u)}" stroke-linecap="round" filter="url(#${uid}smoke)"/>`;
    }
  }

  const pad = wide ? w * 0.06 : w * 0.085;
  const box = wide
    ? { x: pad, y: h * 0.22, w: w * 0.52, h: h * 0.56 }
    : { x: pad, y: h * 0.48, w: w - pad * 2, h: h * 0.38 };
  const t = title(c, box, {
    font: 'abril', maxSize: (wide ? 50 : 46) * u, minSize: 14 * u, lineHeight: 1.0, tracking: 0.01, upper: true,
    valign: 'bottom', maxLines: wide ? 3 : 4, layers: [`fill="${pal.text}"`],
    subFont: 'barlowSemi', subSize: 11 * u, subTracking: 0.22, subFill: pal.secondary,
  });
  s += `<rect x="${n(pad)}" y="${n(t.top - 14 * u)}" width="${n(30 * u)}" height="${n(3 * u)}" fill="${pal.accent}"/>`;
  s += t.svg;

  const what = m.isSeries ? 'A SERIES FROM' : 'A FILM FROM';
  s += label(join([what, m.yearLabel], ' '), {
    x: pad, y: wide ? h * 0.14 : h * 0.085, font: 'barlowSemi', size: 10.5 * u, tracking: 0.32,
    attrs: `fill="${pal.secondary}"`, maxWidth: w - pad * 2,
  });
  const by = h - (wide ? h * 0.085 : h * 0.06);
  s += label(join(m.genres, ' · '), {
    x: pad, y: by, font: 'barlow', size: 10 * u, upper: true, tracking: 0.2, maxWidth: w * 0.6,
    attrs: `fill="${mix(pal.text, pal.bg, 0.35)}"`,
  });
  s += ratingBadge({ x: w - pad, y: by, text: m.rating, font: 'barlowSemi', size: 11 * u, fill: pal.accent, starFill: pal.accent });
  const inset = Math.min(w, h) * 0.035;
  s += `<rect x="${n(inset)}" y="${n(inset)}" width="${n(w - inset * 2)}" height="${n(h - inset * 2)}" fill="none" stroke="${pal.primary}" stroke-opacity="0.32" stroke-width="${n(u)}"/>`;
  return s;
}
