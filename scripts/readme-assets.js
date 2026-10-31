// Generates the README artwork in docs/: an animated marquee banner (text is
// outlined to paths so GitHub renders it without web fonts), a social preview,
// and showcase images rendered by the real art engine.
//   npm run readme-assets
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import opentype from 'opentype.js';
import { THEMES } from '../src/core/themes.js';
import { artBody } from '../src/core/art/index.js';
import { renderBoard } from '../src/core/board.js';
import { FONTS } from '../src/core/fonts.js';
import { svgToPng } from '../src/node/render.js';
import { encode } from '../src/node/encode.js';
import { meta, catalog } from '../src/node/cinemeta.js';
import { COLLECTIONS, mapLimit } from '../src/node/sources.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (f) => path.join(root, 'docs', f);
mkdirSync(path.join(root, 'docs/themes'), { recursive: true });

const fontCache = {};
function font(key) {
  if (!fontCache[key]) {
    const buf = readFileSync(path.join(root, 'fonts', FONTS[key].file));
    fontCache[key] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return fontCache[key];
}

// Text → SVG path data, centred on cx with its baseline at y.
function outline(key, text, size, cx, y, tracking = 0) {
  const f = font(key);
  const glyphs = f.stringToGlyphs(text);
  const scale = size / f.unitsPerEm;
  const width = glyphs.reduce((w, g) => w + g.advanceWidth * scale + tracking, -tracking);
  let x = cx - width / 2;
  let d = '';
  for (const g of glyphs) {
    d += g.getPath(x, y, size).toPathData(2);
    x += g.advanceWidth * scale + tracking;
  }
  return { d, width };
}

// The artwork is laid out in a 1280 x 440 block, centred vertically in any height.
function banner({ animated = true, w = 1280, h = 440 } = {}) {
  const oy = (h - 440) / 2;
  const signX = 150;
  const signY = 52 + oy;
  const signW = w - 300;
  const signH = 236;
  const title = outline('monoton', 'MARQUEE', 132, w / 2, signY + 168, 6);
  const tag = outline('barlowSemi', 'THEMES · ORIGINAL POSTER ART · CUSTOM ROWS · FOR STREMIO ON EVERY SCREEN', 21, w / 2, oy + 406, 2.6);

  // Bulbs around the sign, in three chase groups.
  const bulbs = [];
  const step = 34;
  const inset = 18;
  for (let x = signX + 30; x <= signX + signW - 30; x += step) bulbs.push([x, signY + inset], [x, signY + signH - inset]);
  for (let y = signY + 30 + step; y <= signY + signH - 30 - step; y += step) bulbs.push([signX + inset, y], [signX + signW - inset, y]);
  const bulbSvg = bulbs.map(([x, y], i) => `<circle class="b b${i % 3}" cx="${x}" cy="${y}" r="5.5"/>`).join('');

  // Letterboard tiles under the sign.
  const words = ['NOW', 'SHOWING', '8 THEMES', 'GOOGLE TV READY'];
  const tileFont = 'bebas';
  const tileSize = 30;
  const tiles = words.map((word) => ({ word, ...outline(tileFont, word, tileSize, 0, 0, 1.5) }));
  const gap = 12;
  const pad = 14;
  const total = tiles.reduce((a, t) => a + t.width + pad * 2, 0) + gap * (tiles.length - 1);
  let tx = w / 2 - total / 2;
  const ty = signY + signH + 26;
  let tileSvg = '';
  tiles.forEach((t, i) => {
    const tw = t.width + pad * 2;
    const hl = i === 2;
    tileSvg += `<rect x="${tx.toFixed(1)}" y="${ty}" width="${tw.toFixed(1)}" height="44" rx="4" fill="${hl ? '#ffd319' : '#f4f0e4'}"/>`;
    tileSvg += `<path d="${outline(tileFont, t.word, tileSize, tx + tw / 2, ty + 33, 1.5).d}" fill="#141414"/>`;
    tx += tw + gap;
  });

  const anim = animated ? `<style>
    .b { fill: #5a4a1a; }
    .b0 { animation: chase 1.2s steps(1) infinite; }
    .b1 { animation: chase 1.2s steps(1) infinite 0.4s; }
    .b2 { animation: chase 1.2s steps(1) infinite 0.8s; }
    @keyframes chase { 0% { fill: #fff6cc; filter: url(#bulbglow); } 33.3% { fill: #5a4a1a; filter: none; } 100% { fill: #5a4a1a; } }
    .flicker { animation: flicker 6s infinite; }
    @keyframes flicker { 0%, 92%, 100% { opacity: 1; } 93% { opacity: .55; } 94% { opacity: 1; } 96% { opacity: .7; } 97% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .b0, .b1, .b2, .flicker { animation: none; } .b { fill: #fff6cc; } }
  </style>` : '<style>.b { fill: #fff6cc; } .b1 { fill: #6b5a22; }</style>';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Marquee: themes for Stremio">
  <title>Marquee: themes for Stremio</title>
  <defs>
    <radialGradient id="g1" cx="${w * 0.85}" cy="${oy - 40}" r="${w * 0.6}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff2bd6" stop-opacity="0.35"/><stop offset="1" stop-color="#ff2bd6" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="${w * 0.08}" cy="${h + 40}" r="${w * 0.55}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#22e1ff" stop-opacity="0.28"/><stop offset="1" stop-color="#22e1ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2bd6"/><stop offset="0.5" stop-color="#ffd319"/><stop offset="1" stop-color="#22e1ff"/></linearGradient>
    <linearGradient id="sign" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0f33"/><stop offset="1" stop-color="#07040f"/></linearGradient>
    <filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bulbglow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  ${anim}
  <rect width="${w}" height="${h}" rx="22" fill="#08060f"/>
  <rect width="${w}" height="${h}" rx="22" fill="url(#g1)"/>
  <rect width="${w}" height="${h}" rx="22" fill="url(#g2)"/>
  <rect x="${signX}" y="${signY}" width="${signW}" height="${signH}" rx="26" fill="url(#sign)" stroke="#ffd319" stroke-opacity="0.55" stroke-width="2.5"/>
  <rect x="${signX + 8}" y="${signY + 8}" width="${signW - 16}" height="${signH - 16}" rx="20" fill="none" stroke="#ffd319" stroke-opacity="0.22" stroke-width="1.5"/>
  ${bulbSvg}
  <g class="flicker"><path d="${title.d}" fill="url(#neon)" filter="url(#glow)"/></g>
  ${tileSvg}
  <path d="${tag.d}" fill="#c9b8ff" fill-opacity="0.85"/>
</svg>
`;
}

const SHOWCASE_ID = 'tt0083658';

async function main() {
  writeFileSync(out('banner.svg'), banner());
  writeFileSync(out('social.png'), svgToPng(banner({ animated: false, w: 1280, h: 640 })));
  console.log('banner.svg, social.png');

  // One title, eight styles.
  const item = await meta('movie', SHOWCASE_ID);
  const pw = 300;
  const ph = 450;
  const gap = 18;
  const cols = 4;
  const W = cols * pw + (cols + 1) * gap;
  const H = 2 * (ph + 40) + 3 * gap;
  let s = `<rect width="${W}" height="${H}" rx="24" fill="#0c0a12"/>`;
  THEMES.forEach((t, i) => {
    const x = gap + (i % cols) * (pw + gap);
    const y = gap + Math.floor(i / cols) * (ph + 40 + gap);
    const a = artBody({ template: t.template, palette: t.palette, item, idPrefix: `g${i}` });
    s += `<clipPath id="c${i}"><rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="12"/></clipPath><g clip-path="url(#c${i})"><svg x="${x}" y="${y}" width="${pw}" height="${ph}" viewBox="0 0 ${a.w} ${a.h}">${a.body}</svg></g>`;
    s += `<text x="${x + pw / 2}" y="${y + ph + 28}" text-anchor="middle" font-family="${FONTS.barlowSemi.family}" font-weight="600" font-size="20" letter-spacing="2" fill="#e9e3ff">${t.name.toUpperCase()}</text>`;
  });
  const gallery = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  writeFileSync(out('gallery.jpg'), await encode(svgToPng(gallery)));
  console.log('gallery.jpg');

  // A TV-style home screen per theme, from real rows.
  const [movies, series] = await Promise.all([catalog('movie', 'top'), catalog('series', 'top')]);
  for (const t of THEMES) {
    const coll = await mapLimit((COLLECTIONS[t.collection.id] || []).slice(0, 6), 6, (c) => meta('movie', c.id).catch(() => null));
    const rows = [
      { name: t.collection.name, type: 'movie', shape: 'landscape', items: coll.filter(Boolean) },
      { name: 'Trending', type: 'movie', shape: 'poster', items: movies.slice(0, 8) },
      { name: 'Trending', type: 'series', shape: 'poster', items: series.slice(0, 8) },
    ];
    const board = renderBoard({ template: t.template, palette: t.palette, rows, title: t.name, idPrefix: t.id });
    writeFileSync(out(`themes/${t.id}.jpg`), await encode(svgToPng(board, { width: 960 })));
    console.log(`themes/${t.id}.jpg`);
  }
}

await main();
