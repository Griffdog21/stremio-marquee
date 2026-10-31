import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { boardRows, setRow, onBoard } from '../src/core/lineup.js';
import { loadPresets } from '../src/node/presets.js';

// Cinemeta's real catalog list (trimmed): two searchable Popular rows, a
// Featured row without search, and a year catalog that never shows on the board.
const CINEMETA = [
  { type: 'movie', id: 'top', name: 'Popular', extra: [{ name: 'genre', options: ['Action'] }, { name: 'search' }, { name: 'skip' }], extraSupported: ['search', 'genre', 'skip'] },
  { type: 'series', id: 'top', name: 'Popular', extra: [{ name: 'search' }, { name: 'skip' }] },
  { type: 'movie', id: 'imdbRating', name: 'Featured', extra: [{ name: 'genre', options: ['Action'] }, { name: 'skip' }] },
  { type: 'movie', id: 'year', name: 'New', extra: [{ name: 'genre', options: ['2026'], isRequired: true }] },
];

test('board rows are judged against the full catalog list', () => {
  const rows = boardRows(CINEMETA, CINEMETA);
  assert.deepEqual(rows.map((r) => `${r.catalog.type}:${r.catalog.id}`), ['movie:top', 'series:top', 'movie:imdbRating']);
  assert.ok(rows.every((r) => r.shown));
  assert.deepEqual(rows.map((r) => r.keepsSearch), [true, true, false]);
});

test('hiding a searchable row keeps it for search; others are removed', () => {
  let now = CINEMETA;
  for (const { catalog } of boardRows(now, CINEMETA)) now = setRow(now, CINEMETA, catalog, false);
  const popular = now.find((c) => c.type === 'movie' && c.id === 'top');
  assert.ok(popular, 'Popular stays in the manifest');
  assert.ok(!onBoard(popular), 'but leaves the home board');
  assert.ok(popular.extra.find((e) => e.name === 'search').isRequired, 'as a search-only catalog');
  assert.equal(popular.extra.find((e) => e.name === 'genre').options[0], 'Action', 'other extras untouched');
  assert.ok(!now.some((c) => c.id === 'imdbRating'), 'Featured (no search) is removed');
  assert.ok(now.some((c) => c.id === 'year'), 'non-board catalogs are never touched');
  assert.ok(boardRows(now, CINEMETA).every((r) => !r.shown));
  assert.ok(!CINEMETA[0].extra[1].isRequired, 'the reference list is not mutated');

  // Showing them again restores the original definitions, in order.
  for (const { catalog } of boardRows(now, CINEMETA)) now = setRow(now, CINEMETA, catalog, true);
  assert.deepEqual(now, CINEMETA);
});

test('rows an add-on has since renamed still match their saved copy', () => {
  const saved = [{ type: 'movie', id: 'mq-movies', name: '🎃 Trending Movies', extra: [] }];
  const live = [{ type: 'movie', id: 'mq-movies', name: '🎃 Trending', extra: [] }];
  assert.ok(boardRows(saved, live)[0].shown, 'not mistaken for a hidden row');
  const hidden = setRow(saved, live, live[0], false);
  assert.equal(hidden.length, 0);
  assert.deepEqual(setRow(hidden, live, live[0], true), live, 'showing it again takes the current name');
  // Ties on one id are still told apart by name.
  const twins = [{ type: 'movie', id: 'x', name: 'A', extra: [] }, { type: 'movie', id: 'x', name: 'B', extra: [] }];
  assert.deepEqual(setRow(twins, twins, twins[1], false).map((c) => c.name), ['A']);
});

test('legacy catalogs (extraRequired / extraSupported) hide the same way', () => {
  const legacy = [{ type: 'movie', id: 'old', name: 'Old', extraSupported: ['search'] }];
  const hidden = setRow(legacy, legacy, legacy[0], false);
  assert.deepEqual(hidden[0].extraRequired, ['search']);
  assert.ok(!onBoard(hidden[0]));
});

test('preset files: valid ones load, bad ones are reported, never thrown', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'marquee-presets-'));
  try {
    writeFileSync(path.join(dir, 'movie-night.json'), JSON.stringify({ theme: 'noir', title: 'Movie Night' }));
    writeFileSync(path.join(dir, 'broken.json'), '{ nope');
    writeFileSync(path.join(dir, 'Bad Name.json'), '{}');
    writeFileSync(path.join(dir, 'haunt.json'), '{}');
    writeFileSync(path.join(dir, 'README.md'), '# not a preset');
    const { presets, errors } = loadPresets(dir);
    assert.deepEqual(presets.map((p) => p.slug), ['movie-night']);
    assert.equal(presets[0].cfg.title, 'Movie Night');
    assert.deepEqual(errors.map((e) => e.file).sort(), ['Bad Name.json', 'broken.json', 'haunt.json']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(loadPresets(path.join(tmpdir(), 'does-not-exist-marquee')), { presets: [], errors: [] });
});
