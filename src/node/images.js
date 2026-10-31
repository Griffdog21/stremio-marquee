// Does a real poster exist? Stremio's image host (metahub) answers missing
// artwork with a redirect to a placeholder, so only a direct 200 image counts.
import { mapLimit } from './sources.js';

const known = new Map();

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    return res.status === 200 && String(res.headers.get('content-type') || '').startsWith('image/');
  } catch {
    return true; // Network trouble: keep the real poster rather than guess.
  }
}

/** Checks every URL once (results are cached) and returns a sync lookup. */
export async function checkImages(urls) {
  const todo = [...new Set(urls.filter((u) => u && !known.has(u)))];
  await mapLimit(todo, 16, async (u) => { known.set(u, await check(u)); });
  return (url) => known.get(url) ?? true;
}
