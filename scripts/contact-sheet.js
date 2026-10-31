// Dev tool: renders every art template against tricky sample titles into
// .cache/contact/<template>.png so layout problems are easy to spot.
//   node scripts/contact-sheet.js [template...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { artBody, TEMPLATES } from '../src/core/art/index.js';
import { getTheme, THEMES } from '../src/core/themes.js';
import { svgToPng } from '../src/node/render.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.cache/contact');
mkdirSync(outDir, { recursive: true });

export const SAMPLES = [
  { id: 'tt0083658', type: 'movie', name: 'Blade Runner', year: '1982', genres: ['Action', 'Drama', 'Sci-Fi'], rating: 8.1 },
  { id: 'tt0167260', type: 'movie', name: 'The Lord of the Rings: The Return of the King', year: '2003', genres: ['Adventure', 'Drama', 'Fantasy'], rating: 9.0 },
  { id: 'tt0903747', type: 'series', name: 'Breaking Bad', year: '2008', releaseInfo: '2008–2013', genres: ['Crime', 'Drama', 'Thriller'], rating: 9.5 },
  { id: 'tt14173636', type: 'movie', name: 'Teenage Sex and Death at Camp Miasma', year: '2026', genres: ['Comedy', 'Horror'], rating: 6.4 },
];

const only = process.argv.slice(2);
const templates = only.length ? only : Object.keys(TEMPLATES);
for (const template of templates) {
  const theme = THEMES.find((t) => t.template === template) || getTheme(template);
  const gap = 20;
  const W = 4 * 300 + 5 * gap;
  const H = 450 + 360 + 3 * gap;
  let s = `<rect width="${W}" height="${H}" fill="#202024"/>`;
  SAMPLES.forEach((item, i) => {
    const a = artBody({ template, palette: theme.palette, item, shape: 'poster', idPrefix: `p${i}` });
    s += `<svg x="${gap + i * (300 + gap)}" y="${gap}" width="300" height="450" viewBox="0 0 ${a.w} ${a.h}">${a.body}</svg>`;
  });
  [SAMPLES[0], SAMPLES[2]].forEach((item, i) => {
    const a = artBody({ template, palette: theme.palette, item, shape: 'landscape', idPrefix: `l${i}` });
    s += `<svg x="${gap + i * (640 + gap)}" y="${2 * gap + 450}" width="640" height="360" viewBox="0 0 ${a.w} ${a.h}">${a.body}</svg>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
  const t0 = performance.now();
  const png = svgToPng(svg);
  writeFileSync(path.join(outDir, `${template}.png`), png);
  console.log(`${template.padEnd(9)} ${(png.length / 1024).toFixed(0)} KB  ${(performance.now() - t0).toFixed(0)} ms`);
}
