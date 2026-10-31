// Resolves the curated collections in data/collections.source.json to IMDb ids
// by searching Cinemeta and matching on title + release year, then writes
// data/collections.json. Run with `npm run collections` after editing lists.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { search, meta } from '../src/node/cinemeta.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(readFileSync(path.join(root, 'data/collections.source.json'), 'utf8'));

const simplify = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');

// Cinemeta's path-based search chokes on punctuation such as "vs." — search words only.
const queryOf = (title) => title.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();

async function resolve(title, year, explicitId) {
  // Explicit ids are for ambiguous titles. Cinemeta often lists a later
  // (e.g. US) release year, so verify the title rather than the year.
  if (explicitId) {
    const m = await meta('movie', explicitId);
    if (m && (simplify(m.name) === simplify(title) || Math.abs(parseInt(m.year, 10) - year) <= 1)) return m;
    throw new Error(`explicit id ${explicitId} is "${m?.name}" (${m?.year})`);
  }
  const results = await search('movie', queryOf(title));
  const want = simplify(title);
  const yearOf = (m) => parseInt(m.year, 10);
  const match = (m, exactYear) => {
    const got = simplify(m.name);
    const dy = Math.abs(yearOf(m) - year);
    if (got === want) return dy <= 1;
    return exactYear && dy === 0 && (got.includes(want) || want.includes(got));
  };
  const hit = results.find((m) => match(m, false)) || results.find((m) => match(m, true));
  if (!hit) {
    const seen = results.slice(0, 3).map((m) => `${m.name} (${m.year}) ${m.id}`).join(' | ');
    throw new Error(`no match; top results: ${seen || 'none'}`);
  }
  return hit;
}

const out = {};
let missing = 0;
for (const [id, list] of Object.entries(source)) {
  out[id] = [];
  for (const [title, year, explicitId] of list) {
    let hit;
    try {
      hit = await resolve(title, year, explicitId);
    } catch (err) {
      missing++;
      console.warn(`  ✗ ${id}: ${title} (${year}): ${err.message}`);
      continue;
    }
    out[id].push({ id: hit.id, name: hit.name, year: hit.year });
    if (simplify(hit.name) !== simplify(title)) console.log(`  ~ ${title} (${year}) → ${hit.name} (${hit.year}) ${hit.id}`);
  }
  console.log(`${id}: ${out[id].length}/${list.length}`);
}
writeFileSync(path.join(root, 'data/collections.json'), `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote data/collections.json (${missing} unresolved)`);
