import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { THEMES } from '../src/core/themes.js';
import { normalizeConfig, encodeConfig } from '../src/core/config.js';
import { buildManifest, resolveRows, toMetas, artToken, parseArtToken } from '../src/core/addon.js';
import { VERSION } from '../src/core/version.js';

const require = createRequire(import.meta.url);
const linter = require('stremio-addon-linter');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('core version matches package.json', () => {
  assert.equal(VERSION, pkg.version);
});

test('every preset manifest passes the official Stremio linter', () => {
  for (const t of THEMES) {
    const manifest = buildManifest({ cfg: normalizeConfig({ theme: t.id }), base: `https://example.com/addon/${t.id}`, preset: true, ext: 'jpg' });
    const result = linter.lintManifest(manifest);
    assert.ok(result.valid, `${t.id}: ${JSON.stringify(result.errors)}`);
    assert.deepEqual(result.warnings, [], `${t.id} warnings`);
    assert.equal(manifest.id, `community.marquee.${t.id}`);
    assert.ok(manifest.catalogs.every((c) => !c.extra.some((e) => e.isRequired)), 'every row can show on the home board');
  }
});

test('custom manifests get a distinct id and pass the linter', () => {
  const cfg = normalizeConfig({ theme: 'noir', rows: ['fresh', 'custom0'], custom: [{ name: 'Mine', ids: ['tt0083658'] }] });
  const token = encodeConfig(cfg);
  const manifest = buildManifest({ cfg, base: `https://srv.example/${token}`, token });
  assert.ok(linter.lintManifest(manifest).valid);
  assert.match(manifest.id, /^community\.marquee\.noir\.[a-z0-9]+$/);
  assert.deepEqual(manifest.catalogs.map((c) => c.id), ['mq-fresh', 'mq-custom0']);
});

test('rows carry theme names, emoji prefixes and shape overrides', () => {
  const rows = resolveRows(normalizeConfig({ theme: 'haunt', names: { movies: 'Now Playing' }, shapes: { series: 'square' } }));
  assert.equal(rows[0].title, '🎃 Midnight Monsters');
  assert.equal(rows[0].shape, 'landscape');
  assert.equal(rows.find((r) => r.id === 'movies').title, '🎃 Now Playing');
  assert.equal(rows.find((r) => r.id === 'series').shape, 'square');
  const bare = resolveRows(normalizeConfig({ theme: 'haunt', prefix: '' }));
  assert.equal(bare[1].title, 'Trending Movies');
});

test('metas: generated art, original posters and per-title swaps', () => {
  const items = [
    { id: 'tt0083658', type: 'movie', name: 'Blade Runner', year: '1982', genres: ['Sci-Fi'], rating: 8.1, poster: 'https://img/p.jpg', background: 'https://img/b.jpg' },
    { id: 'tt0111161', type: 'movie', name: 'The Shawshank Redemption', year: '1994', genres: ['Drama'], rating: 9.3, poster: 'https://img/p2.jpg' },
  ];
  const row = { id: 'movies', type: 'movie', shape: 'poster' };
  const artUrl = (it, shape) => `https://art/${shape}/${it.id}.jpg`;
  const generated = toMetas({ row, items, cfg: normalizeConfig({ posters: { tt0111161: 'https://mine/shawshank.png' } }), artUrl });
  assert.equal(generated[0].poster, 'https://art/poster/tt0083658.jpg');
  assert.equal(generated[1].poster, 'https://mine/shawshank.png');
  assert.equal(generated[0].imdbRating, '8.1');
  assert.equal(generated[0].posterShape, 'poster');
  const original = toMetas({ row: { ...row, shape: 'landscape' }, items, cfg: normalizeConfig({ art: 'original' }), artUrl });
  assert.equal(original[0].poster, 'https://img/b.jpg', 'widescreen original cards use the backdrop');
  assert.equal(original[1].poster, 'https://img/p2.jpg', 'falls back to the poster without a backdrop');
});

test('art tokens round-trip unicode titles', () => {
  const it = { id: 'tt0211915', name: 'Amélie — Le Fabuleux Destin', year: '2001', genres: ['Comedy', 'Romance', 'Extra'], rating: 8.3, type: 'movie' };
  const back = parseArtToken(artToken(it));
  assert.equal(back.name, it.name);
  assert.deepEqual(back.genres, ['Comedy', 'Romance']);
  assert.equal(back.rating, 8.3);
});
