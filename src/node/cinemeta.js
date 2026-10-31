// Thin client for Stremio's public Cinemeta addon (the same data Stremio's own
// home screen uses). Responses are cached in memory; the server and the static
// build share this module.
const BASE = 'https://v3-cinemeta.strem.io';
const cache = new Map();
const TTL = 6 * 60 * 60 * 1000;

export async function fetchJson(url, { retries = 2, timeout = 15000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'user-agent': 'stremio-marquee (+https://github.com/Griffdog21/stremio-marquee)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function cached(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const pending = fetchJson(url).then((value) => {
    cache.set(url, { at: Date.now(), value });
    return value;
  });
  // Share in-flight requests, but don't cache failures.
  cache.set(url, { at: Date.now(), value: pending });
  try {
    return await pending;
  } catch (err) {
    cache.delete(url);
    throw err;
  }
}

export function normalize(meta) {
  if (!meta) return null;
  const id = meta.imdb_id || meta.id;
  const genres = meta.genres || meta.genre || [];
  const rating = parseFloat(meta.imdbRating);
  return {
    id,
    type: meta.type,
    name: meta.name || '',
    year: String(meta.releaseInfo || meta.year || '').slice(0, 4),
    releaseInfo: meta.releaseInfo || meta.year || '',
    genres: Array.isArray(genres) ? genres : [],
    rating: Number.isFinite(rating) ? rating : null,
    runtime: meta.runtime || '',
    poster: meta.poster || '',
    background: meta.background || '',
    logo: meta.logo || '',
    description: meta.description || '',
  };
}

export async function catalog(type, id, extra = {}) {
  const parts = Object.entries(extra)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  const url = `${BASE}/catalog/${type}/${id}${parts.length ? `/${parts.join('&')}` : ''}.json`;
  const data = await cached(url);
  return (data.metas || []).map(normalize).filter((m) => m && /^tt\d+$/.test(m.id));
}

export async function meta(type, id) {
  const data = await cached(`${BASE}/meta/${type}/${id}.json`);
  return normalize(data.meta);
}

export async function search(type, query) {
  return catalog(type, 'top', { search: query });
}
