// Aurora: curtains of northern light rippling over snow-capped peaks.
import { n, mix, lighten } from '../util.js';
import { linear, blur, stars, title, meta, label, measure } from './common.js';

// Catmull-Rom spline through points, as cubic Béziers.
function smooth(points) {
  let d = `M${n(points[0][0])},${n(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n(c1[0])},${n(c1[1])} ${n(c2[0])},${n(c2[1])} ${n(p2[0])},${n(p2[1])}`;
  }
  return d;
}

function range(c, base, rough, fill, count) {
  const { w, h, r } = c;
  const pts = [[0, h]];
  const peaks = [];
  for (let i = 0; i <= count; i++) {
    const x = (i / count) * w + r.range(-0.03, 0.03) * w;
    const y = base - (i % 2 ? r.range(0.4, 1) : r.range(0, 0.3)) * rough;
    pts.push([x, y]);
    if (i % 2) peaks.push([x, y]);
  }
  pts.push([w, h]);
  return { svg: `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${fill}"/>`, peaks };
}

const sparkle = (cx, cy, r) =>
  `M${n(cx)},${n(cy - r)}Q${n(cx)},${n(cy)} ${n(cx + r)},${n(cy)}Q${n(cx)},${n(cy)} ${n(cx)},${n(cy + r)}Q${n(cx)},${n(cy)} ${n(cx - r)},${n(cy)}Q${n(cx)},${n(cy)} ${n(cx)},${n(cy - r)}Z`;

export default function aurora(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);

  let s = '<defs>';
  s += linear(`${uid}sky`, [[0, pal.bg], [0.6, pal.surface], [1, mix(pal.surface, pal.primary, 0.16)]]);
  s += blur(`${uid}wide`, 11 * u);
  s += blur(`${uid}rays`, 1.3 * u);
  s += blur(`${uid}core`, 0.9 * u);
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}sky)"/>`;
  s += stars(c, wide ? 90 : 70, { y1: h * 0.7, color: pal.text, rmin: 0.3, rmax: 1 });

  const colors = r.shuffle([pal.primary, pal.secondary, pal.accent]);
  const ribbons = r.int(2, 3);
  for (let k = 0; k < ribbons; k++) {
    const base = h * ((wide ? 0.22 : 0.17) + k * (wide ? 0.13 : 0.09));
    const amp = h * r.range(0.04, 0.08);
    const phase = r.range(0, Math.PI * 2);
    const freq = r.range(1.6, 2.6);
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const x = -0.1 * w + (i / 6) * 1.2 * w;
      pts.push([x, base + amp * Math.sin(phase + (i / 6) * freq * Math.PI)]);
    }
    const d = smooth(pts);
    const col = colors[k % colors.length];
    s += `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="0.38" stroke-width="${n(36 * u)}" filter="url(#${uid}wide)"/>`;
    s += `<path d="${d}" fill="none" stroke="${col}" stroke-opacity="0.26" stroke-width="${n(44 * u)}" stroke-dasharray="${n(1.6 * u)} ${n(3.4 * u)}" transform="translate(0 ${n(-12 * u)})" filter="url(#${uid}rays)"/>`;
    s += `<path d="${d}" fill="none" stroke="${lighten(col, 0.5)}" stroke-opacity="0.75" stroke-width="${n(2.2 * u)}" filter="url(#${uid}core)"/>`;
  }

  const far = range(c, h * (wide ? 0.72 : 0.7), h * 0.18, mix(pal.surface, pal.bg, 0.25), wide ? 10 : 6);
  s += far.svg;
  for (const [px, py] of far.peaks) {
    const sz = 9 * u;
    s += `<polygon points="${n(px)},${n(py)} ${n(px + sz)},${n(py + sz * 1.05)} ${n(px + sz * 0.2)},${n(py + sz * 0.75)} ${n(px - sz * 0.3)},${n(py + sz * 1.15)} ${n(px - sz)},${n(py + sz * 0.95)}" fill="${pal.text}" fill-opacity="0.55"/>`;
  }
  s += range(c, h * (wide ? 0.83 : 0.8), h * 0.1, mix(pal.bg, '#000000', 0.35), wide ? 8 : 5).svg;

  const pad = wide ? w * 0.07 : w * 0.08;
  const box = wide
    ? { x: pad, y: h * 0.74, w: w - pad * 2, h: h * 0.15 }
    : { x: pad, y: h * 0.73, w: w - pad * 2, h: h * 0.15 };
  const t = title(c, box, {
    font: 'syncopate', maxSize: (wide ? 30 : 26) * u, minSize: 8.5 * u, lineHeight: 1.3, tracking: 0.12, upper: true,
    anchor: 'middle', valign: 'center', maxLines: 3, layers: [`fill="${pal.text}"`],
    subFont: 'barlowSemi', subSize: 10 * u, subTracking: 0.3, subFill: pal.primary, subGap: 0.9,
  });
  s += t.svg;
  const yy = Math.min(h - 10 * u, t.bottom + 20 * u);
  if (m.yearLabel) {
    s += label(m.yearLabel, { x: w / 2, y: yy, font: 'barlowSemi', size: 11 * u, tracking: 0.42, anchor: 'middle', attrs: `fill="${pal.primary}"` });
    const half = measure('barlowSemi', m.yearLabel, 11 * u, 0.42 * 11 * u) / 2 + 10 * u;
    s += `<g stroke="${pal.primary}" stroke-opacity="0.6" stroke-width="${n(u)}"><line x1="${n(w / 2 - half - 32 * u)}" y1="${n(yy - 4 * u)}" x2="${n(w / 2 - half)}" y2="${n(yy - 4 * u)}"/><line x1="${n(w / 2 + half)}" y1="${n(yy - 4 * u)}" x2="${n(w / 2 + half + 32 * u)}" y2="${n(yy - 4 * u)}"/></g>`;
  }
  if (m.rating) {
    const ry = wide ? h * 0.12 : h * 0.065;
    s += `<path d="${sparkle(w - pad - 36 * u, ry - 4 * u, 6 * u)}" fill="${pal.accent}"/>`;
    s += label(m.rating, { x: w - pad, y: ry, font: 'barlowSemi', size: 12 * u, anchor: 'end', attrs: `fill="${pal.text}"` });
  }
  if (m.genres.length) {
    s += label(m.genres.join(' · '), {
      x: pad, y: wide ? h * 0.12 : h * 0.065, font: 'barlowSemi', size: 10 * u, upper: true, tracking: 0.28,
      maxWidth: w - pad * 2 - 60 * u, attrs: `fill="${pal.muted}"`,
    });
  }
  return s;
}
