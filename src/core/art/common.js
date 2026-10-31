// Building blocks shared by the art templates.
import { n } from '../util.js';
import { fitText, textBlock, label, capHeight, measure } from '../text.js';

export { label, measure };

/**
 * "★ 8.1" with the star measured clear of the number. With anchor 'end', x is
 * the right edge; with 'start', the left edge.
 */
export function ratingBadge({ x, y, text, font, size, fill, starFill, anchor = 'end' }) {
  if (!text) return '';
  const tw = measure(font, text, size);
  const r = size * 0.42;
  const gap = size * 0.3;
  const cy = y - capHeight(font, size) / 2;
  const starCx = anchor === 'end' ? x - tw - gap - r : x + r;
  const tx = anchor === 'end' ? x : x + r * 2 + gap;
  return `<path d="${starPath(starCx, cy, r)}" fill="${starFill}"/>${label(text, { x: tx, y, font, size, anchor, attrs: `fill="${fill}"` })}`;
}

export function meta(item) {
  const isSeries = item.type === 'series';
  const year = item.year || '';
  const yearLabel = isSeries && item.releaseInfo ? String(item.releaseInfo).replace(/-/g, '–') : year;
  const genres = (item.genres || []).slice(0, 2);
  const rating = typeof item.rating === 'number' && item.rating > 0 ? item.rating.toFixed(1) : '';
  return { isSeries, year, yearLabel, genres, rating };
}

export function starPath(cx, cy, r, inner = 0.42) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${n(cx + rad * Math.cos(a))},${n(cy + rad * Math.sin(a))}`;
  }
  return `${d}Z`;
}

const stopsOf = (stops) =>
  stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a !== 1 ? ` stop-opacity="${n(a)}"` : ''}/>`)
    .join('');

export function linear(id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false } = {}) {
  const units = user ? ' gradientUnits="userSpaceOnUse"' : '';
  return `<linearGradient id="${id}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${units}>${stopsOf(stops)}</linearGradient>`;
}

// Radial gradients are always in user space so they behave the same on any shape.
export function radial(id, stops, { cx, cy, r }) {
  return `<radialGradient id="${id}" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" gradientUnits="userSpaceOnUse">${stopsOf(stops)}</radialGradient>`;
}

// `region` ({ w, h }) pins the filter to the canvas, which keeps blurs of huge
// or rotated groups cheap to render.
export function blur(id, std, region) {
  const area = region
    ? `filterUnits="userSpaceOnUse" x="0" y="0" width="${n(region.w)}" height="${n(region.h)}"`
    : 'x="-50%" y="-50%" width="200%" height="200%"';
  return `<filter id="${id}" ${area}><feGaussianBlur stdDeviation="${n(std)}"/></filter>`;
}

export function glow(id, std) {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="${n(std)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

export function stars(c, count, { x0 = 0, y0 = 0, x1 = c.w, y1 = c.h, color = '#ffffff', rmin = 0.4, rmax = 1.2 } = {}) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const cx = c.r.range(x0, x1);
    const cy = c.r.range(y0, y1);
    s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(c.r.range(rmin, rmax) * c.u)}" fill="${color}" fill-opacity="${n(c.r.range(0.25, 0.95))}"/>`;
  }
  return s;
}

/**
 * Lay out the title (and its kicker, e.g. "Part Two") inside a box.
 * `layers` is a list of attribute strings; the title is drawn once per layer
 * (glows first, crisp text last).
 */
export function title(c, box, o) {
  const {
    font,
    maxSize,
    minSize = 10 * c.u,
    lineHeight = 1,
    tracking = 0,
    upper = false,
    lower = false,
    maxLines = 3,
    anchor = 'start',
    valign = 'top',
    layers = ['fill="#fff"'],
    sub = true,
    subFont = 'barlowSemi',
    subSize = 11 * c.u,
    subTracking = 0.18,
    subUpper = true,
    subFill = '#fff',
    subGap = 0.7,
    text: override,
  } = o;
  let text = override ?? c.title.main;
  if (lower) text = text.toLowerCase();
  const kicker = sub ? c.title.sub : '';
  const subH = kicker ? subSize * (1 + subGap) : 0;
  const fit = fitText(text, {
    font, maxWidth: box.w, maxHeight: box.h - subH, maxLines, maxSize, minSize, lineHeight, tracking, upper,
  });
  const cap = capHeight(font, fit.size);
  const visual = cap + (fit.lines.length - 1) * fit.lh + subH;
  let top = box.y;
  if (valign === 'center') top = box.y + (box.h - visual) / 2;
  if (valign === 'bottom') top = box.y + box.h - visual;
  const x = anchor === 'middle' ? box.x + box.w / 2 : anchor === 'end' ? box.x + box.w : box.x;
  const baseline = top + cap;
  let svg = '';
  for (const attrs of layers) svg += textBlock(fit, { x, y: baseline, font, anchor, attrs });
  const lastBaseline = baseline + (fit.lines.length - 1) * fit.lh;
  let bottom = lastBaseline;
  if (kicker) {
    bottom = lastBaseline + subSize * (1 + subGap);
    svg += label(kicker, {
      x, y: bottom, font: subFont, size: subSize, maxWidth: box.w, anchor,
      tracking: subTracking, upper: subUpper, attrs: `fill="${subFill}"`,
    });
  }
  return { svg, top, bottom, fit, x, baseline, lastBaseline, height: visual };
}

// A notched (stepped-corner) rectangle, the signature art-deco frame.
export function notchedRect(x, y, w, h, s) {
  const x1 = x + w;
  const y1 = y + h;
  return `M${n(x + s)},${n(y)}H${n(x1 - s)}V${n(y + s)}H${n(x1)}V${n(y1 - s)}H${n(x1 - s)}V${n(y1)}H${n(x + s)}V${n(y1 - s)}H${n(x)}V${n(y + s)}H${n(x + s)}Z`;
}

// Join non-empty parts with a separator.
export const join = (parts, sep = ' · ') => parts.filter(Boolean).join(sep);
