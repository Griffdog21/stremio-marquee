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

// Preview images (site and README) show real posters too. resvg can't fetch
// URLs, so they are downloaded once, shrunk, and embedded as data URIs.
const embedded = new Map();
let sharp;
async function shrink(buf) {
  if (sharp === undefined) sharp = await import('sharp').then((m) => m.default).catch(() => null);
  if (!sharp) return null;
  return sharp(buf).resize({ width: 420, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
}

/** Returns a sync lookup: URL → data URI (or null if it couldn't be fetched). */
export async function embedImages(urls) {
  const todo = [...new Set(urls.filter((u) => u && !embedded.has(u)))];
  await mapLimit(todo, 12, async (u) => {
    try {
      const res = await fetch(u, { headers: { accept: 'image/jpeg,image/png;q=0.9' } });
      const small = res.ok ? await shrink(Buffer.from(await res.arrayBuffer())) : null;
      embedded.set(u, small ? `data:image/jpeg;base64,${small.toString('base64')}` : null);
    } catch {
      embedded.set(u, null);
    }
  });
  return (url) => (url ? embedded.get(url) ?? null : null);
}

/** Checks every URL once (results are cached) and returns a sync lookup. */
export async function checkImages(urls) {
  const todo = [...new Set(urls.filter((u) => u && !known.has(u)))];
  await mapLimit(todo, 16, async (u) => { known.set(u, await check(u)); });
  return (url) => known.get(url) ?? true;
}
