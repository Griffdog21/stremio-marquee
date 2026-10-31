// Hallowed: a harvest moon, bats, a graveyard hill and a dead tree.
import { n, mix, lighten, darken } from '../util.js';
import { linear, radial, blur, stars, title, meta, ratingBadge, label } from './common.js';

// A bat in a 40 x 13 box, centred on (20, 7).
const BAT =
  'M20,4C21,3 22,2.5 22.5,1.5L23,4.5C26,2 31,0.5 36,2C38,2.8 39.5,4 40,6C37.5,5.2 35.5,6 34.5,8' +
  'C33,6.5 30.5,6.6 29,8.5C27.5,7.2 25.5,7.6 24,9.5C23,10.5 21.5,12 20,13C18.5,12 17,10.5 16,9.5' +
  'C14.5,7.6 12.5,7.2 11,8.5C9.5,6.6 7,6.5 5.5,8C4.5,6 2.5,5.2 0,6C0.5,4 2,2.8 4,2C9,0.5 14,2 17,4.5' +
  'L17.5,1.5C18,2.5 19,3 20,4Z';

function branch(r, x, y, len, ang, depth, width, out) {
  const x2 = x + len * Math.cos(ang);
  const y2 = y + len * Math.sin(ang);
  out.push(`<line x1="${n(x)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y2)}" stroke-width="${n(width)}"/>`);
  if (depth === 0) return;
  const kids = depth > 2 ? 2 : r.int(1, 2);
  for (let k = 0; k < kids; k++) {
    const turn = (k ? 0.42 : -0.42) + r.range(-0.3, 0.3);
    branch(r, x2, y2, len * r.range(0.62, 0.78), ang + turn, depth - 1, width * 0.66, out);
  }
}

export default function haunt(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const night = '#07020b';

  const moonR = wide ? h * 0.24 : w * 0.2;
  const moonX = wide ? w * r.range(0.68, 0.8) : w * (r.chance(0.5) ? 0.66 : 0.34);
  const moonY = wide ? h * 0.3 : h * 0.2;
  const y0 = h * (wide ? 0.84 : 0.86);
  const yc = h * (wide ? 0.74 : 0.79);
  const y1 = h * (wide ? 0.86 : 0.88);
  const hillY = (t) => (1 - t) ** 2 * y0 + 2 * (1 - t) * t * yc + t ** 2 * y1;

  let s = '<defs>';
  s += linear(`${uid}sky`, [[0, pal.bg], [0.62, pal.surface], [1, mix(pal.surface, pal.primary, 0.4)]]);
  s += radial(`${uid}moon`, [[0, lighten(pal.accent, 0.75)], [0.7, lighten(pal.accent, 0.25)], [1, pal.accent]], { cx: moonX - moonR * 0.3, cy: moonY - moonR * 0.3, r: moonR * 1.4 });
  s += blur(`${uid}soft`, 14 * u);
  s += blur(`${uid}mist`, 6 * u);
  s += blur(`${uid}halo`, 5 * u);
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="url(#${uid}sky)"/>`;
  s += stars(c, wide ? 40 : 26, { y1: h * 0.55, color: pal.text, rmax: 1 });

  // Moon, craters and a drifting cloud.
  s += `<circle cx="${n(moonX)}" cy="${n(moonY)}" r="${n(moonR * 1.5)}" fill="${pal.accent}" fill-opacity="0.22" filter="url(#${uid}soft)"/>`;
  s += `<circle cx="${n(moonX)}" cy="${n(moonY)}" r="${n(moonR)}" fill="url(#${uid}moon)"/>`;
  for (let i = 0; i < 4; i++) {
    const a = r.range(0, Math.PI * 2);
    const d = r.range(0.1, 0.6) * moonR;
    s += `<circle cx="${n(moonX + d * Math.cos(a))}" cy="${n(moonY + d * Math.sin(a))}" r="${n(r.range(0.08, 0.17) * moonR)}" fill="${darken(pal.accent, 0.18)}" fill-opacity="0.35"/>`;
  }
  s += `<ellipse cx="${n(moonX + r.range(-0.4, 0.4) * moonR)}" cy="${n(moonY + moonR * r.range(0.35, 0.65))}" rx="${n(moonR * 1.5)}" ry="${n(moonR * 0.1)}" fill="${pal.surface}" fill-opacity="0.55" filter="url(#${uid}mist)"/>`;

  for (let i = 0, count = r.int(3, 6); i < count; i++) {
    const a = r.range(0, Math.PI * 2);
    const d = r.range(1.15, 2.1) * moonR;
    const bx = Math.min(w - 30 * u, Math.max(10 * u, moonX + d * Math.cos(a)));
    const by = Math.max(10 * u, Math.min(h * 0.6, moonY + d * Math.sin(a) * 0.8));
    const sc = r.range(0.45, 1.05) * u;
    s += `<path d="${BAT}" fill="${night}" transform="translate(${n(bx)} ${n(by)}) rotate(${n(r.range(-18, 18))}) scale(${n(sc)}) translate(-20 -7)"/>`;
  }

  // Back hill, front hill, tree, headstones, pumpkin.
  s += `<path d="M0,${n(h * (wide ? 0.78 : 0.8))}Q${n(w * 0.3)},${n(h * (wide ? 0.66 : 0.72))} ${n(w * 0.62)},${n(h * 0.79)}T${w},${n(h * 0.75)}L${w},${h}L0,${h}Z" fill="${mix(pal.surface, night, 0.55)}"/>`;
  s += `<path d="M0,${n(y0)}Q${n(w / 2)},${n(yc)} ${w},${n(y1)}L${w},${h}L0,${h}Z" fill="${night}"/>`;
  const treeLeft = moonX > w / 2;
  const tt = treeLeft ? 0.1 : 0.9;
  const parts = [];
  branch(r, w * tt, hillY(tt) + 2 * u, h * (wide ? 0.16 : 0.1), -Math.PI / 2 + r.range(-0.15, 0.15), 5, 7 * u, parts);
  s += `<g stroke="${night}" stroke-linecap="round">${parts.join('')}</g>`;
  const stones = r.int(2, 3);
  for (let i = 0; i < stones; i++) {
    const t = treeLeft ? 0.42 + i * 0.16 + r.range(-0.03, 0.03) : 0.18 + i * 0.16 + r.range(-0.03, 0.03);
    const sx = w * t;
    const sy = hillY(t);
    const sw = r.range(11, 15) * u;
    const sh = r.range(15, 21) * u;
    s += `<path d="M${n(sx - sw / 2)},${n(sy + 4 * u)}V${n(sy - sh + sw / 2)}A${n(sw / 2)},${n(sw / 2)} 0 0 1 ${n(sx + sw / 2)},${n(sy - sh + sw / 2)}V${n(sy + 4 * u)}Z" fill="${mix(night, pal.surface, 0.35)}" transform="rotate(${n(r.range(-8, 8))} ${n(sx)} ${n(sy)})"/>`;
  }
  if (r.chance(0.65)) {
    const pt = treeLeft ? 0.88 : 0.1;
    const px = w * pt;
    const pr = (wide ? 13 : 11) * u;
    const py = hillY(pt) - pr * 0.7;
    s += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(pr * 2.2)}" fill="${pal.primary}" fill-opacity="0.25" filter="url(#${uid}halo)"/>`;
    s += `<rect x="${n(px - pr * 0.12)}" y="${n(py - pr * 1.12)}" width="${n(pr * 0.24)}" height="${n(pr * 0.4)}" fill="#4a6b2a"/>`;
    for (const dx of [-0.42, 0.42, 0]) {
      s += `<ellipse cx="${n(px + dx * pr)}" cy="${n(py)}" rx="${n(pr * 0.62)}" ry="${n(pr * 0.82)}" fill="${dx ? darken(pal.primary, 0.12) : pal.primary}"/>`;
    }
    const e = pr * 0.2;
    s += `<g fill="${lighten(pal.accent, 0.3)}"><path d="M${n(px - pr * 0.42)},${n(py - e * 0.2)}l${n(e)},${n(-e * 1.4)}l${n(e)},${n(e * 1.4)}Z"/><path d="M${n(px + pr * 0.02)},${n(py - e * 0.2)}l${n(e)},${n(-e * 1.4)}l${n(e)},${n(e * 1.4)}Z"/><path d="M${n(px - pr * 0.45)},${n(py + e * 0.9)}h${n(pr * 0.9)}l${n(-pr * 0.12)},${n(e * 1.3)}l${n(-pr * 0.16)},${n(-e * 0.6)}l${n(-pr * 0.18)},${n(e * 0.6)}l${n(-pr * 0.18)},${n(-e * 0.6)}l${n(-pr * 0.14)},${n(e * 0.6)}Z"/></g>`;
  }
  s += `<ellipse cx="${n(w * 0.5)}" cy="${n(h * 0.93)}" rx="${n(w * 0.7)}" ry="${n(h * 0.05)}" fill="${pal.text}" fill-opacity="0.07" filter="url(#${uid}mist)"/>`;

  // Title between the moon and the hills.
  const pad = wide ? w * 0.06 : w * 0.07;
  const box = wide
    ? { x: pad, y: h * 0.14, w: w * 0.54, h: h * 0.5 }
    : { x: pad, y: moonY + moonR + h * 0.05, w: w - pad * 2, h: h * 0.73 - (moonY + moonR + h * 0.05) };
  s += title(c, box, {
    font: 'creepster', maxSize: (wide ? 58 : 52) * u, minSize: 14 * u, lineHeight: 1.0, tracking: 0.02, anchor: wide ? 'start' : 'middle',
    valign: 'center', maxLines: 3,
    layers: [
      `fill="${pal.primary}" fill-opacity="0.7" filter="url(#${uid}halo)"`,
      `fill="${pal.primary}" stroke="${night}" stroke-width="${n(3 * u)}" stroke-linejoin="round" paint-order="stroke"`,
    ],
    subFont: 'barlowSemi', subSize: 11 * u, subTracking: 0.24, subFill: pal.accent,
  }).svg;

  const by = h - h * (wide ? 0.06 : 0.04);
  if (m.yearLabel) s += label(`EST. ${m.yearLabel}`, { x: pad, y: by, font: 'barlowSemi', size: 11 * u, tracking: 0.26, attrs: `fill="${pal.accent}"` });
  s += ratingBadge({ x: w - pad, y: by, text: m.rating, font: 'barlowSemi', size: 11.5 * u, fill: pal.text, starFill: pal.primary });
  return s;
}
