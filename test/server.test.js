import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHandler } from '../src/server/handler.js';
import { encodeConfig } from '../src/core/config.js';
import { artToken } from '../src/core/addon.js';
import { enhancedTheme, stylusTheme } from '../src/core/css-theme.js';
import { THEMES } from '../src/core/themes.js';

// These tests stay offline: no Cinemeta calls.
let server;
let base;
test.before(async () => {
  server = http.createServer(createHandler());
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const get = async (path) => {
  const res = await fetch(base + path, { redirect: 'manual' });
  return { res, body: Buffer.from(await res.arrayBuffer()) };
};

test('default manifest with CORS', async () => {
  const { res, body } = await get('/manifest.json');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  const m = JSON.parse(body);
  assert.equal(m.id, 'community.marquee.neon');
  assert.ok(m.logo.startsWith(base));
});

test('configured manifest and configure redirect', async () => {
  const token = encodeConfig({ theme: 'deco', rows: ['movies'] });
  const m = JSON.parse((await get(`/${token}/manifest.json`)).body);
  assert.equal(m.catalogs.length, 1);
  assert.ok(m.logo.startsWith(`${base}/${token}/`));
  const { res } = await get(`/${token}/configure`);
  assert.equal(res.status, 302);
  assert.ok(res.headers.get('location').endsWith(`/studio.html#cfg=${token}`));
});

test('unknown catalogs return an empty list', async () => {
  const { res, body } = await get('/catalog/movie/not-a-row.json');
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(body), { metas: [] });
});

test('art renders on demand from its URL alone', async () => {
  const token = artToken({ id: 'tt0083658', name: 'Blade Runner', year: '1982', genres: ['Sci-Fi'], rating: 8.1, type: 'movie' });
  const ext = JSON.parse((await get('/manifest.json')).body).background.split('.').pop();
  const { res, body } = await get(`/art/p/${token}.${ext}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^image\//);
  assert.match(res.headers.get('cache-control'), /immutable/);
  assert.ok(body.length > 1000);
});

test('bad input is rejected cleanly', async () => {
  assert.equal((await get('/eyJicm9rZW4/manifest.json')).res.status, 400);
  assert.equal((await get('/art/x/abc.png')).res.status, 404);
  assert.equal((await get('/art/p/not-a-token.png')).res.status, 400);
  assert.ok((await get('/%2e%2e/package.json')).res.status >= 400, 'no path traversal');
});

test('desktop and web themes carry the metadata their loaders need', () => {
  for (const t of THEMES) {
    const enhanced = enhancedTheme({ themeId: t.id, base: 'https://example.com' });
    for (const tag of ['@name', '@description', '@updateUrl', '@version', '@author']) assert.ok(enhanced.includes(tag), `${t.id} ${tag}`);
    assert.ok(enhanced.includes('--primary-background-color'));
    const stylus = stylusTheme({ themeId: t.id, base: 'https://example.com' });
    assert.ok(stylus.startsWith('/* ==UserStyle=='));
    assert.ok(stylus.includes('@-moz-document domain("web.stremio.com")'));
    assert.ok(stylus.indexOf('@import') < stylus.indexOf('@-moz-document'), '@import must precede the document block');
  }
});
