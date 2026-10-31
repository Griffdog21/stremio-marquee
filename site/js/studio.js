// The Marquee Studio: edit a configuration and watch it on a virtual TV. The
// preview is drawn by the very same art engine the addon uses (src/core).
import { THEMES, getTheme, PALETTE_KEYS } from '../core/themes.js';
import { normalizeConfig, encodeConfig, exportConfig, decodeConfig, BUILTIN_ROWS, CARD_SHAPES } from '../core/config.js';
import { resolveRows, rowDefs } from '../core/addon.js';
import { renderBoard } from '../core/board.js';
import { renderArt } from '../core/art/index.js';
import { enhancedTheme, stylusTheme } from '../core/css-theme.js';
import {
  applyTheme, siteInfo, presetManifest, stremioLink, webInstallLink, qrSvg, copyText, download, seasonalTheme, store, h, toast,
} from './common.js';

const $ = (id) => document.getElementById(id);
const CINEMETA = 'https://v3-cinemeta.strem.io';
const REPO = 'https://github.com/Griffdog21/stremio-marquee';
const COLOR_LABELS = { bg: 'Background', surface: 'Surface', primary: 'Primary', secondary: 'Secondary', accent: 'Accent', text: 'Text', muted: 'Muted' };
const ROW_LABELS = { spotlight: 'Spotlight', movies: 'Trending movies', series: 'Trending series', mood: 'Mood row', fresh: 'New this year' };
const SHAPE_LABELS = { poster: 'Poster', landscape: 'Widescreen', square: 'Square' };
const metahub = (kind, id) => `https://images.metahub.space/${kind}/${kind === 'poster' ? 'small' : 'medium'}/${id}/img`;

const info = await siteInfo();

// --- Preview data ---------------------------------------------------------------
const slimMeta = (m) => ({
  id: m.imdb_id || m.id, type: m.type, name: m.name, year: String(m.releaseInfo || m.year || '').slice(0, 4),
  releaseInfo: m.releaseInfo, genres: m.genres || m.genre || [], rating: parseFloat(m.imdbRating) || null,
  poster: m.poster, background: m.background,
});
async function liveSample() {
  const top = (type) => fetch(`${CINEMETA}/catalog/${type}/top.json`).then((r) => r.json())
    .then((j) => j.metas.slice(0, 16).map(slimMeta)).catch(() => []);
  return { movies: await top('movie'), series: await top('series'), mood: {} };
}
const sample = (await fetch('data/sample.json').then((r) => (r.ok ? r.json() : null)).catch(() => null)) || (await liveSample());
const collections = await fetch('data/collections.json').then((r) => r.json()).catch(() => ({}));
// Addresses already published from presets/, so "Publish" becomes "Update".
const publishedSlugs = new Set(((await fetch('addons.json').then((r) => (r.ok ? r.json() : null)).catch(() => null))?.custom || []).map((a) => a.slug));
const metaCache = new Map();

// Look a title up by IMDb id (trying the other type too: pasted ids can be either).
async function ensureMeta(id, type) {
  if (metaCache.has(id)) return;
  metaCache.set(id, { id, type, name: '…' });
  for (const t of [type, type === 'movie' ? 'series' : 'movie']) {
    try {
      const { meta } = await fetch(`${CINEMETA}/meta/${t}/${id}.json`).then((r) => r.json());
      if (meta?.name) {
        metaCache.set(id, slimMeta(meta));
        schedule();
        return;
      }
    } catch {
      // Try the other type.
    }
  }
  metaCache.set(id, { id, type, name: id });
  schedule();
}

async function search(query, types) {
  const q = query.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < 2) return [];
  const lists = await Promise.all(types.map((type) =>
    fetch(`${CINEMETA}/catalog/${type}/top/search=${encodeURIComponent(q)}.json`).then((r) => r.json())
      .then((j) => (j.metas || []).slice(0, 5).map(slimMeta)).catch(() => [])));
  return lists.flat().filter((m) => /^tt\d+$/.test(m.id));
}

// --- State ---------------------------------------------------------------------------
// `state` may hold empty collections while you build them; `current()` is the
// cleaned-up configuration that actually gets encoded and previewed.
let state = initialState();
let server = '';

function initialState() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('server')) store.set('server', hash.get('server'));
  const fromHash = hash.get('cfg') && decodeConfig(hash.get('cfg'));
  const theme = new URLSearchParams(location.search).get('theme') || store.get('theme', seasonalTheme());
  return structuredClone(fromHash || normalizeConfig({ theme }));
}

function pruned(s) {
  const keep = [];
  const map = {};
  s.custom.forEach((c, i) => {
    if (c.ids.length) {
      map[`custom${i}`] = `custom${keep.length}`;
      keep.push(c);
    }
  });
  const remap = (id) => (id.startsWith('custom') ? map[id] : id);
  const keys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [remap(k), v]).filter(([k]) => k));
  return { ...s, custom: keep, rows: s.rows.map(remap).filter(Boolean), names: keys(s.names), shapes: keys(s.shapes) };
}

const current = () => normalizeConfig(pruned(state));
const palette = () => ({ ...getTheme(state.theme).palette, ...state.colors });

// --- Rendering -----------------------------------------------------------------------
let pending = 0;
function schedule() {
  clearTimeout(pending);
  pending = setTimeout(render, 90);
}

function itemsFor(row, cfg) {
  const theme = getTheme(cfg.theme);
  if (row.id === 'spotlight') {
    return (collections[theme.collection.id] || []).map((c) => ({ ...c, type: 'movie', poster: metahub('poster', c.id), background: metahub('background', c.id) }));
  }
  if (row.id === 'movies') return sample.movies;
  if (row.id === 'series') return sample.series;
  if (row.id === 'mood') {
    const mood = sample.mood?.[theme.id];
    return mood?.length ? mood : sample.movies.filter((m) => m.genres?.includes(theme.mood.genre)).concat(sample.movies);
  }
  if (row.id === 'fresh') {
    const year = String(new Date().getFullYear());
    const fresh = sample.movies.filter((m) => m.year === year);
    return fresh.length >= 4 ? fresh : sample.movies;
  }
  const c = cfg.custom[Number(row.id.slice(6))];
  return c ? c.ids.map((id) => metaCache.get(id) || { id, type: c.type, name: '…' }) : [];
}

function imageFor(cfg, row, item) {
  if (cfg.posters[item.id]) return cfg.posters[item.id];
  if (cfg.art !== 'original') return null;
  return row.shape === 'landscape' ? item.background || metahub('background', item.id) : item.poster || metahub('poster', item.id);
}

function render() {
  const cfg = current();
  const theme = getTheme(cfg.theme);
  const template = cfg.template || theme.template;
  const pal = palette();
  applyTheme(cfg.theme, { colors: cfg.colors, template: cfg.template });

  const rows = resolveRows(cfg).map((row) => ({
    name: row.title,
    type: row.type,
    shape: row.shape,
    items: itemsFor(row, cfg).slice(0, 8),
    imageFor: (item) => imageFor(cfg, row, item),
  })).filter((r) => r.items.length);
  $('preview').innerHTML = rows.length
    ? renderBoard({ template, palette: pal, rows, title: cfg.title || theme.name, idPrefix: 'pv' })
    : '<p style="position:absolute;inset:0;display:grid;place-items:center;margin:0;color:#aaa">Turn on a row to see it here.</p>';

  // Close-ups: a few posters at full size plus one widescreen card. Image URLs
  // can come from a shared link, so they go through the DOM, never into HTML.
  const tile = (url, art) => (url ? h('div', {}, h('img', { src: url, alt: '' })) : h('div', { html: art() }));
  const posterRow = resolveRows(cfg).find((r) => r.shape !== 'landscape');
  const wideRow = resolveRows(cfg).find((r) => r.shape === 'landscape');
  const tiles = [];
  if (posterRow) {
    itemsFor(posterRow, cfg).slice(0, 4).forEach((item, i) => {
      tiles.push(tile(imageFor(cfg, posterRow, item),
        () => renderArt({ template, palette: pal, item, shape: posterRow.shape === 'square' ? 'square' : 'poster', idPrefix: `cu${i}` })));
    });
  }
  if (wideRow) {
    const item = itemsFor(wideRow, cfg)[0];
    if (item) tiles.push(tile(imageFor(cfg, wideRow, item), () => renderArt({ template, palette: pal, item, shape: 'landscape', idPrefix: 'cuw' })));
  }
  $('closeups').replaceChildren(...tiles);
  renderInstall(cfg);
}

// --- Install, export and share ----------------------------------------------------------------
function installButtons(manifest, qrText) {
  const main = h('div', {},
    h('div', { class: 'btn-row' },
      h('a', { class: 'btn small', href: stremioLink(manifest) }, 'Install in Stremio'),
      h('a', { class: 'btn small ghost', href: webInstallLink(manifest), target: '_blank', rel: 'noopener' }, 'Stremio Web')),
    h('div', { class: 'url-box' }, h('code', {}, manifest),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => copyText(manifest, 'Install link') }, 'Copy')),
    h('p', { class: 'hint' }, 'Install from any device signed in to your Stremio account; it syncs to your TV.'));
  return qrText ? h('div', { class: 'install-grid' }, main, h('figure', { class: 'qr-card', style: 'margin:0', html: qrSvg(qrText) })) : main;
}

// Publishing: the Studio can't write to GitHub itself, so it opens GitHub's
// "new file" page pre-filled with presets/<slug>.json for you to commit.
const RESERVED = new Set(THEMES.flatMap((t) => [t.id, `${t.id}-classic`]));
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const repoOk = (r) => /^[\w.-]+\/[\w.-]+$/.test(r);
function pagesBase(repo) {
  if (repo.toLowerCase() === String(info.repo || '').toLowerCase()) return info.base;
  const [owner, name] = repo.split('/');
  return name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${name.toLowerCase()}` : `https://${owner.toLowerCase()}.github.io/${name}`;
}

function updatePublish(cfg) {
  const repo = $('pub-repo').value.trim() || info.repo || 'Griffdog21/stremio-marquee';
  const fallback = slugify(cfg.title) || `my-${cfg.theme}`;
  $('pub-slug').placeholder = fallback;
  const slug = slugify($('pub-slug').value) || fallback;
  const out = $('pub-result');
  if (!repoOk(repo)) return out.replaceChildren(h('p', { class: 'error' }, 'Enter the repository as owner/name, e.g. you/stremio-marquee.'));
  if (RESERVED.has(slug)) return out.replaceChildren(h('p', { class: 'error' }, `“${slug}” belongs to a stock theme; pick another address.`));
  const branch = info.branch || 'main';
  const file = `${JSON.stringify(exportConfig(cfg), null, 2)}\n`;
  const existing = repo.toLowerCase() === String(info.repo || '').toLowerCase() && publishedSlugs.has(slug);
  let link = `https://github.com/${repo}/new/${branch}/presets?filename=${encodeURIComponent(`${slug}.json`)}&value=${encodeURIComponent(file)}`;
  const tooLong = link.length > 7500; // very large setups: paste the JSON by hand
  if (tooLong) link = `https://github.com/${repo}/new/${branch}/presets?filename=${encodeURIComponent(`${slug}.json`)}`;
  if (existing) link = `https://github.com/${repo}/edit/${branch}/presets/${slug}.json`;
  const manifest = `${pagesBase(repo)}/addon/${slug}/manifest.json`;
  out.replaceChildren(
    h('div', { class: 'btn-row', style: 'margin-top:12px' },
      h('a', { class: 'btn small', href: link, target: '_blank', rel: 'noopener' }, existing ? 'Update on GitHub' : 'Publish with GitHub'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => copyText(file, 'Preset JSON') }, 'Copy JSON')),
    existing || tooLong
      ? h('p', { class: 'hint' }, existing ? `“${slug}” is already published: copy the JSON, paste it over the file on GitHub, and commit.` : 'This setup is too big to pre-fill: copy the JSON and paste it into the new file before committing.')
      : null,
    h('p', { class: 'hint' }, 'Once the build finishes (about two minutes after committing), install it here:'),
    installButtons(manifest));
}

function updateServer(cfg, token) {
  const out = $('server-result');
  if (!server) return out.replaceChildren();
  out.replaceChildren(h('p', { class: 'hint' }, `Served live by ${new URL(server).host}:`), installButtons(`${server}/${token}/manifest.json`));
}

function renderInstall(cfg) {
  const token = encodeConfig(cfg);
  const theme = getTheme(cfg.theme);
  $('share-url').textContent = `${location.origin}${location.pathname}#cfg=${token}${server ? `&server=${encodeURIComponent(server)}` : ''}`;

  // Stock designs (with generated art or real posters) are already hosted.
  const real = token === encodeConfig({ theme: cfg.theme, art: 'original' });
  const stock = real || token === encodeConfig({ theme: cfg.theme });
  $('install-stock').hidden = !stock;
  $('install-custom').hidden = stock;
  if (stock) {
    $('install-stock').replaceChildren(
      h('p', {}, h('b', {}, `This is the stock ${theme.name} theme${real ? ' with real posters' : ''}.`), ' It\'s hosted free and refreshed daily, with nothing to set up. Change anything and it becomes your own add-on.'),
      installButtons(presetManifest(info.base, cfg.theme, real), `${info.base}/?theme=${cfg.theme}${real ? '' : '&posters=art'}#install`));
    return;
  }
  updatePublish(cfg);
  updateServer(cfg, token);
}

$('pub-repo').addEventListener('input', () => updatePublish(current()));
$('pub-slug').addEventListener('input', () => updatePublish(current()));
$('server-url').addEventListener('change', () => {
  server = $('server-url').value.trim().replace(/\/+$/, '');
  if (server && !/^https:\/\//.test(server) && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(server)) toast('Stremio needs an https:// address');
  store.set('server', server);
  schedule();
});
$('deploy-vercel').href = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(REPO)}&project-name=marquee`;
$('deploy-render').href = `https://render.com/deploy?repo=${REPO}`;
$('deploy-other').href = `${REPO}#-custom-setups`;

$('dl-enhanced').addEventListener('click', () => {
  const cfg = current();
  download(`marquee-${cfg.theme}-custom.theme.css`, enhancedTheme({ themeId: cfg.theme, palette: palette(), template: cfg.template, name: `${getTheme(cfg.theme).name} (custom)` }));
});
$('dl-stylus').addEventListener('click', () => {
  const cfg = current();
  download(`marquee-${cfg.theme}-custom.user.css`, stylusTheme({ themeId: cfg.theme, palette: palette(), template: cfg.template, name: `${getTheme(cfg.theme).name} (custom)` }));
});
$('copy-share').addEventListener('click', () => copyText($('share-url').textContent, 'Share link'));

// --- Controls --------------------------------------------------------------------------------
function buildThemeChips() {
  $('theme-chips').replaceChildren(...THEMES.map((t) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(state.theme === t.id),
    onclick: () => {
      state = { ...state, theme: t.id, template: null, colors: {}, prefix: null };
      store.set('theme', t.id);
      buildAll();
    },
  }, h('i', { style: `background:${t.palette.primary}` }), `${t.emoji} ${t.name}`)));
}

function buildArt() {
  const sel = $('template');
  sel.replaceChildren(h('option', { value: '' }, 'Theme default'),
    ...THEMES.map((t) => h('option', { value: t.template, selected: state.template === t.template }, `${t.name} art`)));
  sel.value = state.template || '';
  $('art').value = state.art;
}
$('template').addEventListener('change', (e) => { state.template = e.target.value || null; schedule(); });
$('art').addEventListener('change', (e) => { state.art = e.target.value; schedule(); });

function buildColors() {
  const pal = palette();
  $('colors').replaceChildren(...PALETTE_KEYS.map((k) => {
    const input = h('input', { type: 'color', value: pal[k], 'aria-label': COLOR_LABELS[k] });
    input.addEventListener('input', () => { state.colors = { ...state.colors, [k]: input.value }; schedule(); });
    return h('label', {}, input, COLOR_LABELS[k]);
  }));
}
$('reset-colors').addEventListener('click', () => { state.colors = {}; buildColors(); schedule(); });

function rowMeta(id) {
  const theme = getTheme(state.theme);
  if (id.startsWith('custom')) {
    const c = state.custom[Number(id.slice(6))];
    return { label: c?.name || 'Collection', name: c?.name || '', shape: c?.shape || 'poster', custom: true };
  }
  const def = rowDefs(theme)[id];
  return { label: ROW_LABELS[id], name: def.name, shape: def.shape, custom: false };
}

function buildRows() {
  const customIds = state.custom.map((_, i) => `custom${i}`);
  const ids = [...state.rows, ...[...BUILTIN_ROWS, ...customIds].filter((id) => !state.rows.includes(id))];
  $('rows').replaceChildren(...ids.map((id) => {
    const on = state.rows.includes(id);
    const meta = rowMeta(id);
    const idx = state.rows.indexOf(id);
    const name = h('input', {
      type: 'text', value: meta.custom ? meta.name : state.names[id] || '', placeholder: meta.name, maxlength: 40,
      'aria-label': `${meta.label} row name`,
    });
    name.addEventListener('input', () => {
      if (meta.custom) state.custom[Number(id.slice(6))].name = name.value;
      else if (name.value.trim()) state.names = { ...state.names, [id]: name.value };
      else { const { [id]: _, ...rest } = state.names; state.names = rest; }
      schedule();
    });
    const shape = h('select', { 'aria-label': `${meta.label} card shape` },
      ...CARD_SHAPES.map((s) => h('option', { value: s, selected: (state.shapes[id] || meta.shape) === s }, SHAPE_LABELS[s])));
    shape.addEventListener('change', () => { state.shapes = { ...state.shapes, [id]: shape.value }; schedule(); });
    const toggle = h('input', { type: 'checkbox', checked: on, 'aria-label': `Show ${meta.label} row` });
    toggle.addEventListener('change', () => {
      state.rows = toggle.checked ? [...state.rows, id] : state.rows.filter((r) => r !== id);
      buildRows();
      schedule();
    });
    const move = (d) => () => {
      const rows = [...state.rows];
      [rows[idx], rows[idx + d]] = [rows[idx + d], rows[idx]];
      state.rows = rows;
      buildRows();
      schedule();
    };
    return h('div', { class: `row-item${on ? '' : ' off'}`, title: meta.label },
      toggle, name, shape,
      h('div', { class: 'move' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${meta.label} up`, disabled: !on || idx === 0, onclick: move(-1) }, '↑'),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${meta.label} down`, disabled: !on || idx === state.rows.length - 1, onclick: move(1) }, '↓')));
  }));
  $('prefix').value = state.prefix ?? '';
  $('prefix').placeholder = `${getTheme(state.theme).emoji} (theme default)`;
  $('no-prefix').checked = state.prefix === '';
  $('count').value = state.count;
  $('count-out').textContent = state.count;
}
// Empty input = the theme's emoji; the checkbox turns prefixes off entirely.
$('prefix').addEventListener('input', (e) => {
  state.prefix = e.target.value.trim() ? e.target.value : null;
  $('no-prefix').checked = false;
  schedule();
});
$('no-prefix').addEventListener('change', (e) => {
  state.prefix = e.target.checked ? '' : null;
  $('prefix').value = '';
  schedule();
});
$('count').addEventListener('input', (e) => { state.count = Number(e.target.value); $('count-out').textContent = e.target.value; schedule(); });

function removeCollection(i) {
  const shift = (id) => {
    if (!id.startsWith('custom')) return id;
    const n = Number(id.slice(6));
    if (n === i) return null;
    return n > i ? `custom${n - 1}` : id;
  };
  const keys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [shift(k), v]).filter(([k]) => k));
  state.custom = state.custom.filter((_, j) => j !== i);
  state.rows = state.rows.map(shift).filter(Boolean);
  state.names = keys(state.names);
  state.shapes = keys(state.shapes);
}

function resultList(results, onPick, label = '+ Add') {
  return results.map((m) => h('div', { class: 'result' },
    h('img', { src: m.poster || metahub('poster', m.id), alt: '', loading: 'lazy' }),
    h('div', {}, h('b', {}, m.name), h('small', {}, `${m.releaseInfo || m.year || ''} · ${m.type}`)),
    h('button', { class: 'btn small ghost', type: 'button', onclick: () => onPick(m) }, label)));
}

function buildCollections() {
  $('collections-empty').hidden = state.custom.length > 0;
  $('collections').replaceChildren(...state.custom.map((c, i) => {
    const name = h('input', { type: 'text', value: c.name, maxlength: 40, 'aria-label': 'Collection name', placeholder: 'Collection name' });
    name.addEventListener('input', () => { c.name = name.value; schedule(); });
    name.addEventListener('change', buildRows);
    const type = h('select', { 'aria-label': 'Collection type' },
      h('option', { value: 'movie', selected: c.type === 'movie' }, 'Movies'), h('option', { value: 'series', selected: c.type === 'series' }, 'Series'));
    type.addEventListener('change', () => { c.type = type.value; c.ids = []; buildCollections(); schedule(); });
    const results = h('div', { class: 'results' });
    const finder = h('input', { type: 'search', placeholder: `Search ${c.type === 'series' ? 'series' : 'movies'} to add…`, 'aria-label': 'Search titles' });
    let timer;
    finder.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const found = await search(finder.value, [c.type]);
        results.replaceChildren(...resultList(found.filter((m) => !c.ids.includes(m.id)), (m) => {
          metaCache.set(m.id, m);
          c.ids = [...c.ids, m.id].slice(0, 60);
          if (!state.rows.includes(`custom${i}`)) state.rows = [...state.rows, `custom${i}`];
          finder.value = '';
          results.replaceChildren();
          buildCollections();
          buildRows();
          schedule();
        }));
      }, 280);
    });
    const paste = h('textarea', { placeholder: 'Or paste IMDb links / IDs (tt0083658, https://www.imdb.com/title/tt…)', 'aria-label': 'Paste IMDb IDs' });
    paste.addEventListener('change', () => {
      const ids = [...new Set(paste.value.match(/tt\d{5,10}/g) || [])];
      ids.forEach((id) => ensureMeta(id, c.type));
      c.ids = [...new Set([...c.ids, ...ids])].slice(0, 60);
      if (ids.length && !state.rows.includes(`custom${i}`)) state.rows = [...state.rows, `custom${i}`];
      paste.value = '';
      buildCollections();
      buildRows();
      schedule();
    });
    c.ids.forEach((id) => ensureMeta(id, c.type));
    return h('div', { class: 'collection' },
      h('div', { class: 'collection-head' }, name, type,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete collection', onclick: () => { removeCollection(i); buildCollections(); buildRows(); schedule(); } }, '×')),
      h('div', { class: 'tags' }, ...c.ids.map((id) => h('span', { class: 'tag' }, metaCache.get(id)?.name || id,
        h('button', { type: 'button', 'aria-label': 'Remove', onclick: () => { c.ids = c.ids.filter((x) => x !== id); buildCollections(); schedule(); } }, '×')))),
      finder, results, paste);
  }));
}
$('add-collection').addEventListener('click', () => {
  if (state.custom.length >= 6) return toast('Up to six collections');
  state.custom = [...state.custom, { name: `My collection ${state.custom.length + 1}`, type: 'movie', ids: [], shape: 'poster' }];
  buildCollections();
  buildRows();
});

function buildImages() {
  $('title').value = state.title || '';
  $('title').placeholder = `Marquee · ${getTheme(state.theme).name} (custom)`;
  $('logo').value = state.logo;
  $('background').value = state.background;
  $('swaps').replaceChildren(...Object.entries(state.posters).map(([id, url]) => {
    const meta = metaCache.get(id);
    const input = h('input', { type: 'url', value: url, 'aria-label': `Poster image for ${meta?.name || id}` });
    input.addEventListener('change', () => { state.posters = { ...state.posters, [id]: input.value.trim() }; buildImages(); schedule(); });
    return h('div', { class: 'swap' },
      h('img', { src: url, alt: '', onerror: (e) => { e.target.style.visibility = 'hidden'; } }),
      h('label', { class: 'field' }, meta?.name || id, input),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove swap', onclick: () => { const { [id]: _, ...rest } = state.posters; state.posters = rest; buildImages(); schedule(); } }, '×'));
  }));
}
$('title').addEventListener('input', (e) => { state.title = e.target.value; schedule(); });
$('logo').addEventListener('change', (e) => { state.logo = e.target.value.trim(); schedule(); });
$('background').addEventListener('change', (e) => { state.background = e.target.value.trim(); schedule(); });
let swapTimer;
$('swap-search').addEventListener('input', () => {
  clearTimeout(swapTimer);
  swapTimer = setTimeout(async () => {
    const found = await search($('swap-search').value, ['movie', 'series']);
    $('swap-results').replaceChildren(...resultList(found, (m) => {
      const url = window.prompt(`Image URL to use as the poster for "${m.name}":`, '');
      if (!url) return;
      // Stremio Web blocks plain-http images, so insist on https.
      if (!/^https:\/\//.test(url.trim())) return toast('Use an https:// image URL so it shows on every device');
      metaCache.set(m.id, m);
      state.posters = { ...state.posters, [m.id]: url.trim() };
      $('swap-search').value = '';
      $('swap-results').replaceChildren();
      buildImages();
      schedule();
    }, 'Swap'));
  }, 280);
});

function buildAll() {
  buildThemeChips();
  buildArt();
  buildColors();
  buildRows();
  buildCollections();
  buildImages();
  schedule();
}

// Opened from a running Marquee server (its Configure button)? Use that server.
async function detectServer() {
  try {
    const res = await fetch('manifest.json', { cache: 'no-store' });
    if (!res.ok) return '';
    const manifest = await res.json();
    return String(manifest.id).startsWith('community.marquee') ? new URL('.', location.href).href.replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

const detected = await detectServer();
server = detected || store.get('server', '');
$('server-url').value = server;
$('server-details').open = Boolean(detected);
$('pub-repo').value = info.repo || 'Griffdog21/stremio-marquee';
// Arriving from a published add-on's Configure button pre-fills its address.
$('pub-slug').value = new URLSearchParams(location.hash.slice(1)).get('slug') || '';
Object.keys(state.posters).forEach((id) => ensureMeta(id, 'movie'));
buildAll();
