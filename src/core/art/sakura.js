// Sakura: a blossoming branch over washi paper, drifting petals and a red
// hanko seal. Also drawn in lacquer red and gold for Dragon Temple.
import { n, mix, lighten, darken, luminance } from '../util.js';
import { linear, radial, title, meta, label, join } from './common.js';

// A five-petal blossom with notched petal tips.
function blossom(cx, cy, r, rot, fill, centre) {
  let s = `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(rot)})">`;
  const petal = `M0,0C${n(-r * 0.55)},${n(-r * 0.3)} ${n(-r * 0.5)},${n(-r * 1.02)} ${n(-r * 0.1)},${n(-r)}L0,${n(-r * 0.84)}L${n(r * 0.1)},${n(-r)}C${n(r * 0.5)},${n(-r * 1.02)} ${n(r * 0.55)},${n(-r * 0.3)} 0,0Z`;
  for (let i = 0; i < 5; i++) s += `<path d="${petal}" fill="${fill}" transform="rotate(${i * 72})"/>`;
  s += `<circle r="${n(r * 0.24)}" fill="${centre}"/></g>`;
  return s;
}

// A gently curving branch; returns stroke segments and points to bloom at.
function grow(r, x, y, len, ang, depth, width, segs, spots) {
  const x2 = x + len * Math.cos(ang);
  const y2 = y + len * Math.sin(ang);
  const bend = r.range(-0.25, 0.25) * len;
  const qx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend;
  const qy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
  segs.push(`<path d="M${n(x)},${n(y)}Q${n(qx)},${n(qy)} ${n(x2)},${n(y2)}" stroke-width="${n(width)}"/>`);
  spots.push([x2, y2], [qx, qy]);
  if (depth === 0) return;
  const kids = depth > 2 ? 2 : r.int(1, 2);
  for (let k = 0; k < kids; k++) {
    const turn = (k ? 1 : -1) * r.range(0.3, 0.75);
    grow(r, x2, y2, len * r.range(0.55, 0.78), ang + turn, depth - 1, width * 0.62, segs, spots);
  }
}

export default function sakura(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const light = luminance(pal.bg) > 0.45;
  const ink = light ? pal.secondary : lighten(pal.secondary, 0.1);
  const petalA = light ? pal.primary : pal.primary;
  const petalB = lighten(pal.primary, light ? 0.45 : 0.3);

  let s = '<defs>';
  s += linear(`${uid}bg`, [[0, pal.bg], [1, pal.surface]]);
  s += radial(`${uid}sun`, [[0, light ? lighten(pal.primary, 0.82) : pal.accent, light ? 1 : 0.55], [1, light ? lighten(pal.primary, 0.82) : pal.accent, 0]], {
    cx: wide ? w * 0.78 : w * 0.3, cy: wide ? h * 0.32 : h * 0.3, r: Math.min(w, h) * 0.42,
  });
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}bg)"/>`;
  // A soft sun behind the branch, and a few washi fibres.
  s += `<circle cx="${n(wide ? w * 0.78 : w * 0.3)}" cy="${n(wide ? h * 0.32 : h * 0.3)}" r="${n(Math.min(w, h) * 0.3)}" fill="url(#${uid}sun)"/>`;
  let fibres = '';
  for (let i = 0; i < 7; i++) {
    const y = r.range(0.05, 0.95) * h;
    fibres += `<path d="M${n(-10)},${n(y)}C${n(w * 0.3)},${n(y + r.range(-20, 20) * u)} ${n(w * 0.7)},${n(y + r.range(-20, 20) * u)} ${n(w + 10)},${n(y + r.range(-10, 10) * u)}"/>`;
  }
  s += `<g fill="none" stroke="${pal.muted}" stroke-opacity="0.12" stroke-width="${n(0.8 * u)}">${fibres}</g>`;

  // The branch reaches in from a top corner.
  const segs = [];
  const spots = [];
  const fromRight = wide ? false : r.chance(0.6);
  const sx = fromRight ? w + 6 * u : -6 * u;
  const sy = h * (wide ? 0.08 : 0.06);
  const ang = fromRight ? Math.PI * r.range(0.8, 0.9) : Math.PI * r.range(0.1, 0.2);
  grow(r, sx, sy, (wide ? w * 0.2 : w * 0.38), ang, 4, 7 * u, segs, spots);
  s += `<g fill="none" stroke="${ink}" stroke-linecap="round">${segs.join('')}</g>`;
  let flowers = '';
  for (const [x, y] of spots) {
    // Keep blossoms clear of the title (below in portrait, right in widescreen).
    if (y > h * (wide ? 0.62 : 0.5) || (wide && x > w * 0.46)) continue;
    for (let k = 0; k < r.int(1, 2); k++) {
      const fx = x + r.range(-9, 9) * u;
      const fy = y + r.range(-9, 9) * u;
      flowers += blossom(fx, fy, r.range(6, 11) * u, r.range(0, 72), r.chance(0.5) ? petalA : petalB, light ? darken(pal.primary, 0.35) : pal.accent);
    }
    if (r.chance(0.4)) flowers += `<circle cx="${n(x + r.range(-12, 12) * u)}" cy="${n(y + r.range(-12, 12) * u)}" r="${n(2.6 * u)}" fill="${petalA}"/>`;
  }
  s += flowers;

  // Petals drifting down.
  for (let i = 0; i < (wide ? 18 : 13); i++) {
    const px = r.range(0.02, 0.98) * w;
    const py = r.range(0.2, 0.95) * h;
    s += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(4.2 * u)}" ry="${n(2.4 * u)}" fill="${r.chance(0.5) ? petalA : petalB}" fill-opacity="${n(r.range(0.55, 0.9))}" transform="rotate(${n(r.range(0, 180))} ${n(px)} ${n(py)})"/>`;
  }

  // Title, seal and details.
  const pad = wide ? w * 0.06 : w * 0.08;
  const box = wide
    ? { x: w * 0.5, y: h * 0.3, w: w * 0.44, h: h * 0.42 }
    : { x: pad, y: h * 0.56, w: w - pad * 2, h: h * 0.27 };
  const t = title(c, box, {
    font: 'marcellus', maxSize: (wide ? 44 : 38) * u, minSize: 12 * u, lineHeight: 1.08, tracking: 0.04, upper: true,
    anchor: 'middle', valign: 'center', maxLines: 3, layers: [`fill="${pal.text}"`],
    subFont: 'marcellus', subSize: 11 * u, subTracking: 0.12, subUpper: false, subFill: pal.muted,
  });
  s += t.svg;
  const lineY = t.bottom + 14 * u;
  const cx = box.x + box.w / 2;
  s += `<g stroke="${pal.primary}" stroke-width="${n(u)}"><line x1="${n(cx - 46 * u)}" y1="${n(lineY)}" x2="${n(cx - 8 * u)}" y2="${n(lineY)}"/><line x1="${n(cx + 8 * u)}" y1="${n(lineY)}" x2="${n(cx + 46 * u)}" y2="${n(lineY)}"/></g>`;
  s += blossom(cx, lineY, 4.5 * u, 0, pal.primary, pal.accent);

  const by = h - h * (wide ? 0.08 : 0.055);
  s += label(join([m.yearLabel, ...m.genres], '  ·  '), {
    x: pad, y: by, font: 'marcellus', size: 10.5 * u, tracking: 0.14, upper: true, maxWidth: w * 0.6, attrs: `fill="${pal.muted}"`,
  });
  // The hanko seal carries the rating (or the year).
  const sealText = m.rating || m.year;
  if (sealText) {
    const size = 34 * u;
    const sx2 = w - pad - size;
    const sy2 = by - size + 6 * u;
    s += `<g transform="rotate(-4 ${n(sx2 + size / 2)} ${n(sy2 + size / 2)})"><rect x="${n(sx2)}" y="${n(sy2)}" width="${n(size)}" height="${n(size)}" rx="${n(5 * u)}" fill="${pal.accent}"/>`;
    s += `<rect x="${n(sx2 + 3 * u)}" y="${n(sy2 + 3 * u)}" width="${n(size - 6 * u)}" height="${n(size - 6 * u)}" rx="${n(3 * u)}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="${n(u)}"/>`;
    s += label(sealText, { x: sx2 + size / 2, y: sy2 + size / 2 + 4.5 * u, font: 'marcellus', size: 13 * u, anchor: 'middle', maxWidth: size - 8 * u, attrs: 'fill="#ffffff"' });
    s += '</g>';
  }
  return s;
}
