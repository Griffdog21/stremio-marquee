// Where each row's titles come from: Cinemeta catalogs, the curated theme
// collections in data/collections.json, or a user's own list of IMDb ids.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { catalog, meta } from './cinemeta.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const COLLECTIONS = JSON.parse(readFileSync(path.join(root, 'data/collections.json'), 'utf8'));

export async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

async function metasFor(type, ids) {
  const found = await mapLimit(ids, 8, (id) => meta(type, id).catch(() => null));
  return found.filter((m) => m && m.name);
}

export async function loadRowItems(row) {
  const src = row.source;
  if (src.kind === 'cinemeta') return catalog(src.type, src.catalog, src.genre ? { genre: src.genre } : {});
  if (src.kind === 'collection') return metasFor('movie', (COLLECTIONS[src.id] || []).map((x) => x.id));
  if (src.kind === 'ids') return metasFor(src.type, src.ids);
  return [];
}
