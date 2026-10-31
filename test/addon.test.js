import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { THEMES, GROUPS, TEMPLATES } from '../src/core/themes.js';
import { FONTS } from '../src/core/fonts.js';
import { normalizeConfig, encodeConfig } from '../src/core/config.js';
import { buildManifest, resolveRows, toMetas, artToken, parseArtToken } from '../src/core/addon.js';
import { VERSION } from '../src/core/version.js';

const require = createRequire(import.meta.url);
const linter = require('stremio-addon-linter');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('core version matches package.json', () => {
  assert.equal(VERSION, pkg.version);
});

test('every stock manifest and its real-poster twin pass the official Stremio linter', () => {
  const ids = new Set();
  for (const t of THEMES) {
    for (const [variant, cfg] of [['stock', normalizeConfig({ theme: t.id, art: 'art' })], ['classic', normalizeConfig({ theme: t.id })]]) {
      const manifest = buildManifest({ cfg, base: `https://example.com/addon/${t.id}`, variant, ext: 'jpg' });
      const result = linter.lintManifest(manifest);
      assert.ok(result.valid, `${t.id}/${variant}: ${JSON.stringify(result.errors)}`);
      assert.deepEqual(result.warnings, [], `${t.id}/${variant} warnings`);
      assert.ok(manifest.catalogs.every((c) => !c.extra.some((e) => e.isRequired)), 'every row can show on the home board');
      ids.add(manifest.id);
    }
  }
  assert.equal(ids.size, THEMES.length * 2, 'every add-on id is unique, so all can be installed together');
  assert.ok(ids.has('community.marquee.haunt') && ids.has('community.marquee.haunt.classic'));
});

test('every theme has its own collection, one gallery group and a bundled font', () => {
  const collections = JSON.parse(readFileSync(new URL('../data/collections.json', import.meta.url), 'utf8'));
  const siteCss = readFileSync(new URL('../site/css/site.css', import.meta.url), 'utf8');
  const families = new Set(Object.values(FONTS).map((f) => f.family));
  const grouped = GROUPS.flatMap((g) => g.themes);
  assert.equal(new Set(THEMES.map((t) => t.collection.id)).size, THEMES.length, 'collections are not shared');
  assert.equal(grouped.length, THEMES.length, 'groups list each theme once');
  for (const t of THEMES) {
    assert.ok(collections[t.collection.id]?.length >= 15, `${t.id}: collection is resolved`);
    assert.ok(grouped.includes(t.id), `${t.id}: belongs to a group`);
    assert.ok(families.has(t.font) && siteCss.includes(`font-family: '${t.font}'`), `${t.id}: ${t.font} is bundled and loaded`);
  }
  for (const [id, tpl] of Object.entries(TEMPLATES)) assert.ok(families.has(tpl.font), `template ${id}: ${tpl.font} is bundled`);
});

test('custom manifests get a distinct id, the chosen name, and pass the linter', () => {
  const cfg = normalizeConfig({ title: 'Movie Night', theme: 'noir', rows: ['fresh', 'custom0'], custom: [{ name: 'Mine', ids: ['tt0083658'] }] });
  const token = encodeConfig(cfg);
  const live = buildManifest({ cfg, base: `https://srv.example/${token}`, token, variant: 'live' });
  assert.ok(linter.lintManifest(live).valid);
  assert.match(live.id, /^community\.marquee\.noir\.[a-z0-9]+$/);
  assert.equal(live.name, 'Movie Night');
  assert.deepEqual(live.catalogs.map((c) => c.id), ['mq-fresh', 'mq-custom0']);
  const published = buildManifest({ cfg, base: 'https://example.com/addon/movie-night', variant: 'preset', slug: 'movie-night' });
  assert.equal(published.id, 'community.marquee.preset.movie-night');
});

test('rows carry theme names, emoji prefixes and shape overrides', () => {
  const rows = resolveRows(normalizeConfig({ theme: 'haunt', names: { movies: 'Now Playing' }, shapes: { series: 'square' } }));
  assert.equal(rows[0].title, '🎃 Midnight Monsters');
  assert.equal(rows[0].shape, 'landscape');
  assert.equal(rows.find((r) => r.id === 'movies').title, '🎃 Now Playing');
  assert.equal(rows.find((r) => r.id === 'series').shape, 'square');
  const bare = resolveRows(normalizeConfig({ theme: 'haunt', prefix: '' }));
  // Stremio appends " - Movie" / " - Series" itself.
  assert.equal(bare[1].title, 'Trending');
  assert.ok(bare.every((r) => !/\b(movies?|series)\b/i.test(r.name)), 'row names never repeat the type');
});

test('metas: generated art, original posters and per-title swaps', () => {
  const items = [
    { id: 'tt0083658', type: 'movie', name: 'Blade Runner', year: '1982', genres: ['Sci-Fi'], rating: 8.1, poster: 'https://img/p.jpg', background: 'https://img/b.jpg' },
    { id: 'tt0111161', type: 'movie', name: 'The Shawshank Redemption', year: '1994', genres: ['Drama'], rating: 9.3, poster: 'https://img/p2.jpg' },
  ];
  const row = { id: 'movies', type: 'movie', shape: 'poster' };
  const artUrl = (it, shape) => `https://art/${shape}/${it.id}.jpg`;
  const generated = toMetas({ row, items, cfg: normalizeConfig({ art: 'art', posters: { tt0111161: 'https://mine/shawshank.png' } }), artUrl });
  assert.equal(generated[0].poster, 'https://art/poster/tt0083658.jpg');
  assert.equal(generated[1].poster, 'https://mine/shawshank.png');
  assert.equal(generated[0].imdbRating, '8.1');
  assert.equal(generated[0].posterShape, 'poster');
  const original = toMetas({ row: { ...row, shape: 'landscape' }, items, cfg: normalizeConfig({ art: 'original' }), artUrl });
  assert.equal(original[0].poster, 'https://img/b.jpg', 'widescreen original cards use the backdrop');
  const sharp = toMetas({ row, items: [{ ...items[0], poster: 'https://images.metahub.space/poster/small/tt0083658/img' }], cfg: normalizeConfig({ art: 'original' }), artUrl });
  assert.equal(sharp[0].poster, 'https://images.metahub.space/poster/medium/tt0083658/img', 'real posters use the sharper size');
  // Real posters are never replaced, except where a title has none.
  const missing = 'https://img/p2.jpg';
  const fallback = toMetas({ row, items, cfg: normalizeConfig({ art: 'original' }), artUrl, hasImage: (u) => u !== missing });
  assert.equal(fallback[0].poster, 'https://img/p.jpg');
  assert.equal(fallback[1].poster, 'https://art/poster/tt0111161.jpg', 'missing poster → generated art');
  const noBackdrop = toMetas({ row: { ...row, shape: 'landscape' }, items, cfg: normalizeConfig({ art: 'original' }), artUrl });
  assert.equal(noBackdrop[1].poster, 'https://art/landscape/tt0111161.jpg', 'no backdrop → generated wide art, not a stretched poster');
});

test('art tokens round-trip unicode titles', () => {
  const it = { id: 'tt0211915', name: 'Amélie — Le Fabuleux Destin', year: '2001', genres: ['Comedy', 'Romance', 'Extra'], rating: 8.3, type: 'movie' };
  const back = parseArtToken(artToken(it));
  assert.equal(back.name, it.name);
  assert.deepEqual(back.genres, ['Comedy', 'Romance']);
  assert.equal(back.rating, 8.3);
});
