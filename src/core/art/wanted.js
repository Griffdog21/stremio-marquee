// High Noon: a frontier WANTED poster nailed to a weathered wall, with a
// desert vignette, the title as the outlaw's name and the rating as a reward.
import { n, mix, lighten, darken } from '../util.js';
import { linear, radial, title, meta, label } from './common.js';

// A rectangle whose edges are slightly torn.
function ragged(r, x, y, w, h, step, depth) {
  const pts = [];
  for (let px = x; px < x + w; px += step) pts.push([px, y + r.range(0, depth)]);
  for (let py = y; py < y + h; py += step) pts.push([x + w - r.range(0, depth), py]);
  for (let px = x + w; px > x; px -= step) pts.push([px, y + h - r.range(0, depth)]);
  for (let py = y + h; py > y; py -= step) pts.push([x + r.range(0, depth), py]);
  return pts.map(([a, b]) => `${n(a)},${n(b)}`).join(' ');
}

function desert(c, x, y, w, h, ink) {
  const { pal, r, uid, u } = c;
  let s = `<clipPath id="${uid}scene"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath>`;
  s += `<g clip-path="url(#${uid}scene)">`;
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="url(#${uid}sky)"/>`;
  const sunX = x + w * r.range(0.3, 0.7);
  s += `<circle cx="${n(sunX)}" cy="${n(y + h * 0.58)}" r="${n(h * 0.28)}" fill="${lighten(pal.accent, 0.35)}" fill-opacity="0.9"/>`;
  // Mesas on the horizon.
  const base = y + h * 0.72;
  let mesa = `M${n(x)},${n(y + h)}L${n(x)},${n(base)}`;
  let mx = x;
  while (mx < x + w) {
    const mw = r.range(0.18, 0.34) * w;
    const mh = r.range(0.12, 0.32) * h;
    mesa += `L${n(mx + mw * 0.15)},${n(base - mh)}L${n(mx + mw * 0.85)},${n(base - mh)}L${n(mx + mw)},${n(base)}`;
    mx += mw + r.range(0.02, 0.12) * w;
  }
  mesa += `L${n(x + w)},${n(base)}L${n(x + w)},${n(y + h)}Z`;
  s += `<path d="${mesa}" fill="${mix(pal.secondary, ink, 0.35)}"/>`;
  s += `<rect x="${n(x)}" y="${n(base)}" width="${n(w)}" height="${n(y + h - base)}" fill="${mix(pal.secondary, ink, 0.55)}"/>`;
  // A saguaro.
  const cx = x + w * (r.chance(0.5) ? 0.18 : 0.8);
  const ch = h * 0.55;
  const cw = Math.max(4 * u, w * 0.035);
  s += `<g fill="${ink}"><rect x="${n(cx - cw / 2)}" y="${n(y + h - ch)}" width="${n(cw)}" height="${n(ch)}" rx="${n(cw / 2)}"/>`;
  s += `<rect x="${n(cx - cw * 2.2)}" y="${n(y + h - ch * 0.62)}" width="${n(cw * 0.8)}" height="${n(ch * 0.28)}" rx="${n(cw * 0.4)}"/><rect x="${n(cx - cw * 2.2)}" y="${n(y + h - ch * 0.4)}" width="${n(cw * 2)}" height="${n(cw * 0.8)}" rx="${n(cw * 0.4)}"/>`;
  s += `<rect x="${n(cx + cw * 1.4)}" y="${n(y + h - ch * 0.82)}" width="${n(cw * 0.8)}" height="${n(ch * 0.3)}" rx="${n(cw * 0.4)}"/><rect x="${n(cx + cw * 0.2)}" y="${n(y + h - ch * 0.56)}" width="${n(cw * 2)}" height="${n(cw * 0.8)}" rx="${n(cw * 0.4)}"/></g>`;
  s += '</g>';
  s += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${ink}" stroke-width="${n(2.2 * u)}"/>`;
  return s;
}

export default function wanted(c) {
  const { w, h, u, pal, r, uid, wide } = c;
  const m = meta(c.item);
  const ink = mix(pal.bg, '#000000', 0.15);
  const paper = pal.text;

  // Weathered planks behind the poster.
  let s = '<defs>';
  s += linear(`${uid}paper`, [[0, lighten(paper, 0.2)], [1, mix(paper, pal.primary, 0.35)]]);
  s += radial(`${uid}burn`, [[0, '#000000', 0], [0.7, '#000000', 0], [1, darken(pal.primary, 0.5), 0.55]], { cx: w / 2, cy: h / 2, r: Math.hypot(w, h) * 0.52 });
  s += linear(`${uid}sky`, [[0, pal.accent], [1, pal.primary]]);
  s += '</defs>';
  s += `<rect width="${w}" height="${h}" fill="${pal.bg}"/>`;
  let planks = '';
  const pw = wide ? w / 9 : w / 5;
  for (let x = 0; x < w; x += pw) planks += `<rect x="${n(x)}" y="0" width="${n(pw - 2 * u)}" height="${h}" fill="${mix(pal.bg, pal.surface, r.range(0.3, 0.9))}"/>`;
  s += planks;

  const mx = wide ? w * 0.08 : w * 0.07;
  const my = wide ? h * 0.07 : h * 0.045;
  const pts = ragged(r, mx, my, w - mx * 2, h - my * 2, 12 * u, 3 * u);
  s += `<polygon points="${pts}" fill="#000000" fill-opacity="0.45" transform="translate(${n(3 * u)} ${n(4 * u)})"/>`;
  s += `<polygon points="${pts}" fill="url(#${uid}paper)"/><polygon points="${pts}" fill="url(#${uid}burn)"/>`;
  for (const [nx, ny] of [[mx + 12 * u, my + 10 * u], [w - mx - 12 * u, my + 10 * u]]) {
    s += `<circle cx="${n(nx)}" cy="${n(ny)}" r="${n(3 * u)}" fill="${ink}"/>`;
  }

  const inner = { x: mx + 16 * u, w: w - mx * 2 - 32 * u };
  if (wide) {
    // Vignette on the left, the notice on the right.
    const sceneW = inner.w * 0.42;
    s += desert(c, inner.x, my + 18 * u, sceneW, h - my * 2 - 36 * u, ink);
    const tx = inner.x + sceneW + 18 * u;
    const tw = inner.x + inner.w - tx;
    s += label('WANTED', { x: tx + tw / 2, y: my + 62 * u, font: 'rye', size: 46 * u, anchor: 'middle', maxWidth: tw, attrs: `fill="${ink}"` });
    s += label('DEAD OR ALIVE', { x: tx + tw / 2, y: my + 82 * u, font: 'rye', size: 11 * u, tracking: 0.2, anchor: 'middle', maxWidth: tw, attrs: `fill="${pal.secondary}"` });
    s += title(c, { x: tx, y: my + 96 * u, w: tw, h: h * 0.38 }, {
      font: 'rye', maxSize: 32 * u, minSize: 11 * u, lineHeight: 1.05, upper: true, anchor: 'middle', valign: 'center', maxLines: 3,
      layers: [`fill="${ink}"`], subFont: 'rye', subSize: 10 * u, subTracking: 0.1, subFill: pal.secondary,
    }).svg;
    if (m.rating) s += label(`$${Math.round(parseFloat(m.rating) * 1000).toLocaleString('en-US')} REWARD`, { x: tx + tw / 2, y: h - my - 22 * u, font: 'rye', size: 15 * u, anchor: 'middle', maxWidth: tw, attrs: `fill="${pal.secondary}"` });
    if (m.yearLabel) s += label(`LAST SEEN ${m.yearLabel}`, { x: tx + tw / 2, y: h - my - 8 * u, font: 'barlowSemi', size: 9 * u, tracking: 0.25, anchor: 'middle', attrs: `fill="${ink}"` });
    return s;
  }

  const cx = w / 2;
  s += label('WANTED', { x: cx, y: my + 52 * u, font: 'rye', size: 50 * u, anchor: 'middle', maxWidth: inner.w, attrs: `fill="${ink}"` });
  s += `<g stroke="${ink}" stroke-width="${n(1.2 * u)}"><line x1="${n(inner.x)}" y1="${n(my + 60 * u)}" x2="${n(inner.x + inner.w)}" y2="${n(my + 60 * u)}"/><line x1="${n(inner.x)}" y1="${n(my + 63 * u)}" x2="${n(inner.x + inner.w)}" y2="${n(my + 63 * u)}"/></g>`;
  s += label('DEAD OR ALIVE', { x: cx, y: my + 78 * u, font: 'rye', size: 11 * u, tracking: 0.2, anchor: 'middle', attrs: `fill="${pal.secondary}"` });
  const sceneY = my + 88 * u;
  const sceneH = h * 0.27;
  s += desert(c, inner.x, sceneY, inner.w, sceneH, ink);
  const t = title(c, { x: inner.x, y: sceneY + sceneH + 10 * u, w: inner.w, h: h * 0.2 }, {
    font: 'rye', maxSize: 30 * u, minSize: 10 * u, lineHeight: 1.05, upper: true, anchor: 'middle', valign: 'center', maxLines: 3,
    layers: [`fill="${ink}"`], subFont: 'rye', subSize: 10 * u, subTracking: 0.1, subFill: pal.secondary,
  });
  s += t.svg;
  const by = h - my - 30 * u;
  if (m.rating) s += label(`$${Math.round(parseFloat(m.rating) * 1000).toLocaleString('en-US')} REWARD`, { x: cx, y: by, font: 'rye', size: 17 * u, anchor: 'middle', maxWidth: inner.w, attrs: `fill="${pal.secondary}"` });
  if (m.yearLabel) s += label(`LAST SEEN ${m.yearLabel}`, { x: cx, y: by + 16 * u, font: 'barlowSemi', size: 9.5 * u, tracking: 0.25, anchor: 'middle', attrs: `fill="${ink}"` });
  return s;
}
