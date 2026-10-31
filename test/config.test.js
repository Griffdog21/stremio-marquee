import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, encodeConfig, exportConfig, decodeConfig, DEFAULTS, LIMITS } from '../src/core/config.js';

test('defaults are sane', () => {
  const cfg = normalizeConfig({});
  assert.equal(cfg.theme, 'neon');
  assert.deepEqual(cfg.rows, DEFAULTS.rows);
  assert.equal(cfg.art, 'art');
  assert.equal(cfg.count, 40);
});

test('encode/decode round-trips a full configuration', () => {
  const input = {
    theme: 'haunt',
    template: 'deco',
    colors: { primary: '#FF00AA', bg: '#000' },
    art: 'original',
    rows: ['movies', 'custom0', 'fresh'],
    shapes: { movies: 'landscape' },
    names: { movies: 'Hot Right Now' },
    prefix: '★',
    logo: 'https://example.com/logo.png',
    posters: { tt0111161: 'https://example.com/p.jpg' },
    custom: [{ name: 'Faves', type: 'movie', ids: ['tt0083658', 'tt0111161'] }],
    count: 25,
  };
  const token = encodeConfig(input);
  assert.match(token, /^eyJ[A-Za-z0-9_-]+$/, 'tokens are base64url JSON');
  const back = decodeConfig(token);
  assert.equal(back.theme, 'haunt');
  assert.equal(back.template, 'deco');
  assert.equal(back.colors.primary, '#ff00aa');
  assert.deepEqual(back.rows, ['movies', 'custom0', 'fresh']);
  assert.equal(back.names.movies, 'Hot Right Now');
  assert.equal(back.custom[0].ids.length, 2);
  assert.equal(back.count, 25);
});

test('stock themes encode to a tiny token', () => {
  assert.ok(encodeConfig({ theme: 'aurora' }).length < 40);
});

test('hostile or malformed input is cleaned up', () => {
  const cfg = normalizeConfig({
    theme: '../../etc',
    template: 'nope',
    colors: { primary: 'red; background:url(x)', accent: '#12345' },
    rows: ['movies', 'movies', 'drop table', 'custom3'],
    logo: 'javascript:alert(1)',
    background: 'ftp://example.com/x.png',
    posters: { 'not-an-id': 'https://x.y/z.png', tt0111161: 'data:image/png;base64,AAAA' },
    custom: [{ name: 'x'.repeat(200), type: 'film', ids: ['tt1', 'tt0083658', 'bad'] }],
    count: 9999,
    prefix: '🎃🎃🎃🎃🎃🎃',
  });
  assert.equal(cfg.theme, 'neon');
  assert.equal(cfg.template, null);
  assert.deepEqual(cfg.colors, {});
  assert.deepEqual(cfg.rows, ['movies']);
  assert.equal(cfg.logo, '');
  assert.equal(cfg.background, '');
  assert.deepEqual(cfg.posters, {});
  assert.equal(cfg.custom[0].name.length, LIMITS.name);
  assert.equal(cfg.custom[0].type, 'movie');
  assert.deepEqual(cfg.custom[0].ids, ['tt0083658']);
  assert.equal(cfg.count, LIMITS.maxCount);
  assert.equal([...cfg.prefix].length, 4);
});

test('image URLs are normalised so they can never break out of HTML', () => {
  const evil = 'https://x.example/"><img src=x onerror=alert(1)>';
  const cfg = normalizeConfig({ logo: evil, posters: { tt0111161: evil } });
  for (const url of [cfg.logo, cfg.posters.tt0111161]) {
    assert.ok(url.startsWith('https://x.example/'));
    assert.ok(!/["<>]/.test(url), `unsafe characters survived: ${url}`);
  }
});

test('add-on names and emoji prefixes are kept tidy', () => {
  const cfg = normalizeConfig({ title: `  ${'Movie Night '.repeat(10)}`, prefix: '👨‍👩‍👧‍👦🎃🎃🎃🎃' });
  assert.ok(cfg.title.length <= LIMITS.name && !cfg.title.startsWith(' '));
  assert.ok(cfg.prefix.startsWith('👨‍👩‍👧‍👦'), 'a family emoji is not split apart');
  assert.equal(new Intl.Segmenter().segment(cfg.prefix)[Symbol.iterator]().next().value.segment, '👨‍👩‍👧‍👦');
});

test('exported configs are readable and round-trip', () => {
  const input = { theme: 'aurora', title: 'Northern', rows: ['spotlight', 'series'] };
  const out = exportConfig(input);
  assert.deepEqual(Object.keys(out).sort(), ['rows', 'theme', 'title']);
  assert.deepEqual(normalizeConfig(out), normalizeConfig(input));
});

test('garbage tokens decode to null instead of throwing', () => {
  assert.equal(decodeConfig('eyJub3QganNvbg'), null);
  assert.equal(decodeConfig('%%%'), null);
});
