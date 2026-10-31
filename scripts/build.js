// Static build for GitHub Pages: the website, the desktop/web CSS themes, and
// one ready-to-install Stremio addon per theme (manifest, catalogs, art).
//
//   node scripts/build.js              full build into dist/
//   node scripts/build.js --site-only  website + CSS themes only (used by self-hosted servers)
//
// Env: MARQUEE_BASE_URL  public URL of the site (default: the project's GitHub Pages)
//      MARQUEE_THEMES    comma-separated theme ids to build (default: all)
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import path from 'node:path';
import { THEMES } from '../src/core/themes.js';
import { normalizeConfig } from '../src/core/config.js';
import { buildManifest, resolveRows, toMetas, SHAPE_CODES } from '../src/core/addon.js';
import { renderArt, renderLogo, renderBackdrop } from '../src/core/art/index.js';
import { renderBoard } from '../src/core/board.js';
import { enhancedTheme, stylusTheme } from '../src/core/css-theme.js';
import { loadRowItems } from '../src/node/sources.js';
import { IMAGE_EXT } from '../src/node/encode.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(root, 'dist');
const SITE_ONLY = process.argv.includes('--site-only');
const BASE = (process.env.MARQUEE_BASE_URL || 'https://griffdog21.github.io/stremio-marquee').replace(/\/+$/, '');
const ONLY = process.env.MARQUEE_THEMES ? process.env.MARQUEE_THEMES.split(',') : null;
const themes = THEMES.filter((t) => !ONLY || ONLY.includes(t.id));
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const write = (rel, data) => {
  const file = path.join(DIST, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
};
const json = (rel, obj) => write(rel, JSON.stringify(obj));

// --- Worker pool for rasterising art ---------------------------------------
function createPool(size) {
  const workers = Array.from({ length: size }, () => new Worker(new URL('./render-worker.js', import.meta.url)));
  const queue = [];
  const pending = new Map();
  let nextId = 0;
  let bytes = 0;
  const idle = [...workers];
  const pump = () => {
    while (idle.length && queue.length) {
      const w = idle.pop();
      const job = queue.shift();
      pending.set(job.id, job);
      w.postMessage(job.msg);
      w.once('message', (res) => {
        const j = pending.get(res.id);
        pending.delete(res.id);
        idle.push(w);
        if (res.ok) {
          bytes += res.bytes;
          j.resolve();
        } else j.reject(new Error(res.error));
        pump();
      });
    }
  };
  return {
    run(svg, out, opts = {}) {
      mkdirSync(path.dirname(out), { recursive: true });
      return new Promise((resolve, reject) => {
        const id = nextId++;
        queue.push({ id, msg: { id, svg, out, png: !!opts.png }, resolve, reject });
        pump();
      });
    },
    get bytes() { return bytes; },
    close: () => Promise.all(workers.map((w) => w.terminate())),
  };
}

// --- Website ----------------------------------------------------------------
function buildSite() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  cpSync(path.join(root, 'site'), DIST, { recursive: true });
  cpSync(path.join(root, 'src/core'), path.join(DIST, 'core'), { recursive: true });
  cpSync(path.join(root, 'fonts'), path.join(DIST, 'fonts'), { recursive: true });
  cpSync(path.join(root, 'node_modules/qrcode-generator/dist/qrcode.mjs'), path.join(DIST, 'vendor/qrcode.mjs'));
  cpSync(path.join(root, 'data/collections.json'), path.join(DIST, 'data/collections.json'));
  cpSync(path.join(root, 'docs/social.png'), path.join(DIST, 'social.png'));
  // Social cards need absolute URLs.
  for (const page of readdirSync(DIST).filter((f) => f.endsWith('.html'))) {
    const file = path.join(DIST, page);
    writeFileSync(file, readFileSync(file, 'utf8').replaceAll('{{BASE}}', BASE));
  }
  write('.nojekyll', '');
  write('site.json', JSON.stringify({ base: BASE, imageExt: IMAGE_EXT, builtAt: new Date().toISOString() }));

  for (const theme of THEMES) {
    write(`themes/${theme.id}.theme.css`, enhancedTheme({ themeId: theme.id, base: BASE }));
    write(`themes/${theme.id}.user.css`, stylusTheme({ themeId: theme.id, base: BASE }));
  }
  log('site + CSS themes');
}

// --- Addons -----------------------------------------------------------------
async function buildAddons() {
  const pool = createPool(Math.max(1, (os.availableParallelism?.() || os.cpus().length)));
  const jobs = [];
  const presets = [];
  // Real titles for the Studio's live preview.
  const sample = { movies: [], series: [], mood: {} };
  const slim = (it) => ({
    id: it.id, type: it.type, name: it.name, year: it.year, releaseInfo: it.releaseInfo, genres: it.genres.slice(0, 3),
    rating: it.rating, poster: it.poster, background: it.background,
  });

  for (const theme of themes) {
    const cfg = normalizeConfig({ theme: theme.id });
    const dir = `addon/${theme.id}`;
    const base = `${BASE}/${dir}`;
    const rows = resolveRows(cfg);
    const palette = theme.palette;
    const template = theme.template;
    const seen = new Set();
    const loaded = [];

    for (const row of rows) {
      const items = (await loadRowItems(row)).slice(0, cfg.count);
      loaded.push({ row, items });
      const artUrl = (it, shape) => `${base}/art/${SHAPE_CODES[shape]}/${it.id}.${IMAGE_EXT}`;
      // Art is regenerated daily, so keep client caches shorter than a rebuild cycle.
      json(`${dir}/catalog/${row.type}/${row.catalogId}.json`, { metas: toMetas({ row, items, cfg, artUrl }), cacheMaxAge: 14400 });
      if (row.id === 'movies' && !sample.movies.length) sample.movies = items.slice(0, 16).map(slim);
      if (row.id === 'series' && !sample.series.length) sample.series = items.slice(0, 16).map(slim);
      if (row.id === 'mood') sample.mood[theme.id] = items.slice(0, 10).map(slim);
      for (const it of items) {
        const key = `${row.shape}:${it.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const out = path.join(DIST, dir, 'art', SHAPE_CODES[row.shape], `${it.id}.${IMAGE_EXT}`);
        jobs.push(pool.run(renderArt({ template, palette, item: it, shape: row.shape }), out));
      }
    }

    json(`${dir}/manifest.json`, buildManifest({ cfg, base, preset: true, ext: IMAGE_EXT }));
    jobs.push(pool.run(renderLogo({ palette, template, size: 256 }), path.join(DIST, dir, 'logo.png'), { png: true }));
    jobs.push(pool.run(renderBackdrop({ template, palette, name: theme.name }), path.join(DIST, dir, `background.${IMAGE_EXT}`)));
    // Stremio's "Configure" button opens <addon>/configure.
    write(`${dir}/configure/index.html`, `<!doctype html><meta charset="utf-8"><title>Configure Marquee</title><meta http-equiv="refresh" content="0; url=../../../studio.html?theme=${theme.id}"><a href="../../../studio.html?theme=${theme.id}">Open the Marquee Studio</a>`);

    // A TV-style preview of the home screen for the website and README.
    // (Row names without the emoji: resvg has no colour emoji font.)
    const previewRows = loaded
      .filter(({ items }) => items.length)
      .slice(0, 3)
      .map(({ row, items }) => ({ name: row.name, shape: row.shape, items: items.slice(0, 8) }));
    jobs.push(pool.run(renderBoard({ template, palette, rows: previewRows, title: theme.name, idPrefix: theme.id }), path.join(DIST, `previews/${theme.id}.${IMAGE_EXT}`)));

    presets.push({
      id: theme.id,
      name: theme.name,
      manifest: `${base}/manifest.json`,
      rows: rows.map((r) => ({ id: r.id, title: r.title, shape: r.shape, count: loaded.find((l) => l.row.id === r.id)?.items.length || 0 })),
    });
    log(`${theme.id}: ${seen.size} artworks queued`);
  }

  json('presets.json', presets);
  json('data/sample.json', sample);

  await Promise.all(jobs);
  await pool.close();
  log(`${jobs.length} images rendered, ${(pool.bytes / 1024 / 1024).toFixed(1)} MB`);
}

buildSite();
if (!SITE_ONLY) await buildAddons();
log(`done → ${path.relative(root, DIST)}/ (base ${BASE})`);
