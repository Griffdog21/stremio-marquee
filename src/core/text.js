// Text measurement and layout for generated art. Widths come from the bundled
// font metrics, so wrapping decisions are identical in every runtime.
import METRICS from './font-metrics.js';
import { FONTS } from './fonts.js';
import { esc, n } from './util.js';

export function measure(fontKey, text, size, letterSpacing = 0) {
  const m = METRICS[fontKey];
  if (!m) throw new Error(`Unknown font: ${fontKey}`);
  let units = 0;
  let count = 0;
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    let w = cp >= 32 && cp <= 255 ? m.latin[cp - 32] : m.extra[cp] || 0;
    if (!w) w = m.avg;
    units += w;
    count++;
  }
  return (units * size) / m.upm + Math.max(0, count - 1) * letterSpacing;
}

// Cap height in px, for optically centering a line of capitals.
export function capHeight(fontKey, size) {
  const m = METRICS[fontKey];
  return (m.cap / m.upm) * size;
}

// Split "Dune: Part Two" into a headline and a kicker.
export function splitTitle(name) {
  const s = String(name || '').trim().replace(/\s+/g, ' ');
  const m = s.match(/^(.{2,}?)(?::\s+| [-–—] )(.{2,})$/);
  if (m && m[1].length <= 40) return { main: m[1].trim(), sub: m[2].trim() };
  return { main: s, sub: '' };
}

function widthOf(words, fontKey, size, ls) {
  return measure(fontKey, words.join(' '), size, ls);
}

// Break words into exactly `k` lines minimising the widest line (titles are
// short, so a full search over break points is cheap).
function balance(words, k, fontKey, size, ls) {
  const nW = words.length;
  if (k <= 1 || nW <= 1) return [words.join(' ')];
  const memo = new Map();
  const best = (start, linesLeft) => {
    const key = `${start}:${linesLeft}`;
    if (memo.has(key)) return memo.get(key);
    let result;
    if (linesLeft === 1) {
      result = { cost: widthOf(words.slice(start), fontKey, size, ls), breaks: [] };
    } else {
      result = { cost: Infinity, breaks: [] };
      for (let end = start + 1; end <= nW - (linesLeft - 1); end++) {
        const line = widthOf(words.slice(start, end), fontKey, size, ls);
        const rest = best(end, linesLeft - 1);
        const cost = Math.max(line, rest.cost);
        if (cost < result.cost) result = { cost, breaks: [end, ...rest.breaks] };
      }
    }
    memo.set(key, result);
    return result;
  };
  const { breaks } = best(0, Math.min(k, nW));
  const lines = [];
  let prev = 0;
  for (const b of [...breaks, nW]) {
    lines.push(words.slice(prev, b).join(' '));
    prev = b;
  }
  return lines;
}

function greedyLineCount(words, fontKey, size, ls, maxWidth) {
  let lines = 0;
  let cur = [];
  for (const w of words) {
    if (measure(fontKey, w, size, ls) > maxWidth) return Infinity;
    const next = [...cur, w];
    if (cur.length && widthOf(next, fontKey, size, ls) > maxWidth) {
      lines++;
      cur = [w];
    } else {
      cur = next;
    }
  }
  return lines + (cur.length ? 1 : 0);
}

/**
 * Fit text into a box. Returns the largest size (≤ maxSize) where the text
 * wraps into ≤ maxLines lines no wider than maxWidth and no taller than
 * maxHeight. Falls back to minSize with per-line squeeze (textLength).
 */
export function fitText(text, opts) {
  const {
    font,
    maxWidth,
    maxHeight = Infinity,
    maxLines = 3,
    maxSize = 64,
    minSize = 10,
    lineHeight = 1.0,
    tracking = 0, // letter-spacing in em
    upper = false,
    step = 0.5,
  } = opts;
  const str = upper ? String(text).toUpperCase() : String(text);
  const words = str.split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], size: maxSize, ls: 0, lh: maxSize * lineHeight, width: 0, height: 0 };

  for (let size = maxSize; size >= minSize; size -= step) {
    const ls = tracking * size;
    const count = greedyLineCount(words, font, size, ls, maxWidth);
    if (count > maxLines) continue;
    const lh = size * lineHeight;
    const height = size + (count - 1) * lh;
    if (height > maxHeight) continue;
    const lines = balance(words, count, font, size, ls);
    if (lines.some((l) => measure(font, l, size, ls) > maxWidth + 0.5)) {
      // Balanced breaks can be wider than greedy ones; fall back to greedy.
      const greedy = [];
      let cur = [];
      for (const w of words) {
        const next = [...cur, w];
        if (cur.length && widthOf(next, font, size, ls) > maxWidth) {
          greedy.push(cur.join(' '));
          cur = [w];
        } else cur = next;
      }
      if (cur.length) greedy.push(cur.join(' '));
      return finish(greedy, size, ls, lh, font, maxWidth);
    }
    return finish(lines, size, ls, lh, font, maxWidth);
  }

  // Nothing fits: use minSize, squeeze long lines, ellipsize overflow.
  const size = minSize;
  const ls = tracking * size;
  const lh = size * lineHeight;
  let lines = [];
  let cur = [];
  for (const w of words) {
    const next = [...cur, w];
    if (cur.length && widthOf(next, font, size, ls) > maxWidth) {
      lines.push(cur.join(' '));
      cur = [w];
    } else cur = next;
  }
  if (cur.length) lines.push(cur.join(' '));
  const fitLines = Math.max(1, Math.min(maxLines, Math.floor((maxHeight - size) / lh) + 1 || maxLines));
  if (lines.length > fitLines) {
    lines = lines.slice(0, fitLines);
    lines[fitLines - 1] = `${lines[fitLines - 1].replace(/[\s,:;.-]+$/, '')}…`;
  }
  return finish(lines, size, ls, lh, font, maxWidth);
}

function finish(lines, size, ls, lh, font, maxWidth) {
  const widths = lines.map((l) => measure(font, l, size, ls));
  return {
    lines,
    size,
    ls,
    lh,
    widths,
    width: Math.min(maxWidth, Math.max(...widths)),
    height: size + (lines.length - 1) * lh,
    maxWidth,
  };
}

/**
 * Render a fitted block as <text> elements. `y` is the baseline of the first
 * line. Lines wider than the box get textLength so nothing ever overflows.
 */
export function textBlock(fit, { x, y, font, anchor = 'start', attrs = '' }) {
  const f = FONTS[font];
  return fit.lines
    .map((line, i) => {
      const width = fit.widths[i];
      const squeeze = width > fit.maxWidth + 0.5
        ? ` textLength="${n(fit.maxWidth)}" lengthAdjust="spacingAndGlyphs"`
        : '';
      // Letter-spacing also trails the last glyph; nudge centred text back.
      const dx = anchor === 'middle' && fit.ls ? fit.ls / 2 : 0;
      return `<text x="${n(x + dx)}" y="${n(y + i * fit.lh)}" font-family="${esc(f.family)}" font-weight="${f.weight}" font-size="${n(fit.size)}"${fit.ls ? ` letter-spacing="${n(fit.ls)}"` : ''} text-anchor="${anchor}"${squeeze} ${attrs}>${esc(line)}</text>`;
    })
    .join('');
}

// One line of small text (labels, years, ratings), auto-shrunk to fit.
export function label(text, { x, y, font, size, maxWidth = Infinity, anchor = 'start', tracking = 0, upper = false, attrs = '' }) {
  const str = upper ? String(text).toUpperCase() : String(text);
  let s = size;
  while (s > 6 && measure(font, str, s, tracking * s) > maxWidth) s -= 0.5;
  const f = FONTS[font];
  const ls = tracking * s;
  const dx = anchor === 'middle' && ls ? ls / 2 : 0;
  return `<text x="${n(x + dx)}" y="${n(y)}" font-family="${esc(f.family)}" font-weight="${f.weight}" font-size="${n(s)}"${ls ? ` letter-spacing="${n(ls)}"` : ''} text-anchor="${anchor}" ${attrs}>${esc(str)}</text>`;
}
