// The live Marquee addon. Every option lives in the install URL
// (/<config>/manifest.json), so the server keeps no state: catalogs come from
// Cinemeta, and art is rendered on demand from data carried in its own URL.
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { normalizeConfig, decodeConfig } from '../core/config.js';
import { buildManifest, resolveRows, toMetas, artToken, parseArtToken, SHAPE_CODES, SHAPE_FROM_CODE } from '../core/addon.js';
import { renderArt, renderLogo, renderBackdrop } from '../core/art/index.js';
import { getTheme } from '../core/themes.js';
import { loadRowItems } from '../node/sources.js';
import { svgToPng } from '../node/render.js';
import { encode, IMAGE_EXT, IMAGE_TYPE } from '../node/encode.js';

const STATIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
const RESOURCES = new Set(['manifest.json', 'catalog', 'art', 'logo.png', `background.${IMAGE_EXT}`, 'configure']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

// A small LRU so a TV scrolling a row doesn't re-render the same posters.
class Lru {
  constructor(max) { this.max = max; this.map = new Map(); }
  get(k) {
    const v = this.map.get(k);
    if (v !== undefined) { this.map.delete(k); this.map.set(k, v); }
    return v;
  }
  set(k, v) {
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }
}
const images = new Lru(600);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', ...headers });
  res.end(body);
}
const sendJson = (res, obj, maxAge = 3600) =>
  send(res, 200, JSON.stringify(obj), { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}` });

function originOf(req, publicUrl) {
  if (publicUrl) return publicUrl.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0] || (req.socket?.encrypted ? 'https' : 'http');
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0];
  return `${proto}://${host}`;
}

async function serveStatic(res, rel) {
  const target = path.resolve(STATIC_DIR, `.${rel.endsWith('/') ? `${rel}index.html` : rel}`);
  if (target !== STATIC_DIR && !target.startsWith(STATIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
  try {
    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, 'index.html') : target;
    const body = await readFile(file);
    return send(res, 200, body, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=600' });
  } catch {
    return send(res, 404, 'Not found', { 'content-type': 'text/plain' });
  }
}

async function image(res, key, make) {
  let buf = images.get(key);
  if (!buf) {
    buf = await make();
    images.set(key, buf);
  }
  return send(res, 200, buf, { 'content-type': key.endsWith('.png') ? 'image/png' : IMAGE_TYPE, 'cache-control': 'public, max-age=31536000, immutable' });
}

export function createHandler({ publicUrl } = {}) {
  return async function handler(req, res) {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '');
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
      const url = new URL(req.url, 'http://x');
      if (url.pathname.length > 6000) return send(res, 414, 'URI too long');
      const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
      const origin = originOf(req, publicUrl);

      // /<token>/… carries a configuration; bare paths use the defaults. Tokens
      // are base64url JSON, so they always start with "eyJ" ('{"').
      let token = '';
      if (parts.length > 1 && /^eyJ[A-Za-z0-9_-]+$/.test(parts[0])) token = parts.shift();
      if (!parts.length || !RESOURCES.has(parts[0])) return serveStatic(res, url.pathname);

      const cfg = token ? decodeConfig(token) : normalizeConfig({});
      if (!cfg) return send(res, 400, 'Invalid configuration', { 'content-type': 'text/plain' });
      const base = token ? `${origin}/${token}` : origin;
      const theme = getTheme(cfg.theme);
      const template = cfg.template || theme.template;
      const palette = { ...theme.palette, ...cfg.colors };
      const [resource] = parts;

      if (resource === 'manifest.json') {
        return sendJson(res, buildManifest({ cfg, base, token, variant: 'live', ext: IMAGE_EXT }), 300);
      }
      if (resource === 'configure') {
        return send(res, 302, '', { location: `${origin}/studio.html${token ? `#cfg=${token}` : ''}` });
      }
      if (resource === 'catalog') {
        const [, type, rawId] = parts;
        const id = String(rawId || '').replace(/\.json$/, '');
        const row = resolveRows(cfg).find((r) => r.catalogId === id && r.type === type);
        if (!row) return sendJson(res, { metas: [] }, 60);
        const items = await loadRowItems(row);
        const artUrl = (it, shape) => `${base}/art/${SHAPE_CODES[shape]}/${artToken(it)}.${IMAGE_EXT}`;
        return sendJson(res, { metas: toMetas({ row, items, cfg, artUrl }), cacheMaxAge: 21600, staleRevalidate: 86400 }, 21600);
      }
      if (resource === 'logo.png') {
        return image(res, `${base}/logo.png`, () => svgToPng(renderLogo({ palette, template, size: 256 })));
      }
      if (resource === `background.${IMAGE_EXT}`) {
        return image(res, `${base}/bg.${IMAGE_EXT}`, () => encode(svgToPng(renderBackdrop({ template, palette, name: theme.name }))));
      }
      if (resource === 'art') {
        const [, code, file] = parts;
        const shape = SHAPE_FROM_CODE[code];
        const match = /^([A-Za-z0-9_-]+)\.(png|jpg)$/.exec(file || '');
        if (!shape || !match) return send(res, 404, 'Not found');
        let item;
        try {
          item = parseArtToken(match[1]);
        } catch {
          return send(res, 400, 'Invalid art token', { 'content-type': 'text/plain' });
        }
        item.name = item.name.slice(0, 160);
        item.genres = item.genres.slice(0, 3).map((g) => String(g).slice(0, 24));
        return image(res, `${base}/${code}/${match[1]}.${IMAGE_EXT}`, () => encode(svgToPng(renderArt({ template, palette, item, shape }))));
      }
      return send(res, 404, 'Not found');
    } catch (err) {
      console.error(err);
      return send(res, 500, 'Internal error', { 'content-type': 'text/plain' });
    }
  };
}
