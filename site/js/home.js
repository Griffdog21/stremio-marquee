import { THEMES, getTheme } from '../core/themes.js';
import {
  applyTheme, cardVars, siteInfo, presetManifest, stremioLink, webInstallLink, qrSvg, copyText, seasonalTheme, store, h,
} from './common.js';

const info = await siteInfo();
const ext = info.imageExt || 'jpg';
const params = new URLSearchParams(location.search);
const october = new Date().getMonth() === 9;
let current = params.get('theme') || store.get('theme', seasonalTheme());
if (!THEMES.some((t) => t.id === current)) current = seasonalTheme();
let real = params.has('posters') ? params.get('posters') === 'real' : store.get('real-posters', false);

const $ = (id) => document.getElementById(id);
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// --- Gallery ------------------------------------------------------------------
for (const t of THEMES) {
  $('gallery').append(h('article', { class: 'card', style: cardVars(t.palette), 'data-theme': t.id },
    h('button', { class: 'card-select', type: 'button', 'aria-label': `Preview ${t.name}`, onclick: () => select(t.id, true) }),
    october && t.id === 'haunt' ? h('span', { class: 'badge' }, 'Halloween pick') : null,
    h('div', { class: 'card-shot' },
      h('img', { src: `previews/${t.id}.${ext}`, alt: `${t.name} theme on a Stremio home screen`, loading: 'lazy', width: 1280, height: 720 })),
    h('div', { class: 'card-body' },
      h('h3', {}, `${t.emoji} ${t.name}`),
      h('p', {}, t.tagline),
      h('div', { class: 'swatches', 'aria-hidden': 'true' },
        ...['bg', 'surface', 'primary', 'secondary', 'accent'].map((k) => h('i', { style: `background:${t.palette[k]}` }))),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn small', href: stremioLink(presetManifest(info.base, t.id)) }, 'Install'),
        h('a', { class: 'btn small ghost', href: `studio.html?theme=${t.id}` }, 'Customize')))));
}

// --- TV preview -------------------------------------------------------------------------
// Generated art uses the pre-rendered screenshot; real posters are drawn live
// from the same sample rows so the preview matches what installs.
const metahub = (kind, id) => `https://images.metahub.space/${kind}/medium/${id}/img`;
let realData;
async function realPosterBoard(id) {
  realData ??= Promise.all([import('../core/board.js'), json('data/sample.json'), json('data/collections.json')]);
  const [{ renderBoard }, sample, collections] = await realData;
  const theme = getTheme(id);
  const poster = (it) => (it.poster || metahub('poster', it.id)).replace('/poster/small/', '/poster/medium/');
  const rows = [
    { name: `${theme.emoji} ${theme.collection.name}`, type: 'movie', shape: 'landscape', items: (collections?.[theme.collection.id] || []).slice(0, 6), imageFor: (it) => metahub('background', it.id) },
    { name: `${theme.emoji} Trending`, type: 'movie', shape: 'poster', items: sample?.movies?.slice(0, 8) || [], imageFor: poster },
    { name: `${theme.emoji} Trending`, type: 'series', shape: 'poster', items: sample?.series?.slice(0, 8) || [], imageFor: poster },
  ].filter((r) => r.items.length);
  return renderBoard({ template: theme.template, palette: theme.palette, rows, title: theme.name, idPrefix: `rp${id}` });
}

let tvRequest = 0;
async function showOnTv(id) {
  const ticket = ++tvRequest;
  const screen = $('tv-screen');
  let layer;
  if (real) {
    const svg = await realPosterBoard(id);
    if (ticket !== tvRequest) return;
    layer = h('div', { class: 'layer', style: 'opacity:0', html: svg, role: 'img', 'aria-label': `${getTheme(id).name} with real posters on a Stremio home screen` });
    requestAnimationFrame(() => { layer.style.opacity = '1'; });
  } else {
    layer = h('img', { class: 'layer', src: `previews/${id}.${ext}`, alt: `${getTheme(id).name} on a Stremio home screen`, style: 'opacity:0' });
    layer.addEventListener('load', () => requestAnimationFrame(() => { layer.style.opacity = '1'; }));
  }
  screen.append(layer);
  setTimeout(() => [...screen.children].forEach((x) => x !== layer && x.classList.contains('layer') && x.remove()), 900);
}

// --- Selecting a theme / poster style -----------------------------------------------------
function select(id, jump = false) {
  current = id;
  store.set('theme', id);
  const theme = getTheme(id);
  applyTheme(id);
  $('now-showing').textContent = theme.name;
  $('install-name').textContent = real ? `${theme.name} · Real posters` : theme.name;
  $('tv-caption').textContent = `${theme.emoji} ${theme.name}${real ? ' · real posters' : ''} · Stremio home screen`;
  document.querySelectorAll('.theme-name').forEach((el) => { el.textContent = theme.name; });
  document.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-current', String(c.dataset.theme === id)));
  $('posters-art').setAttribute('aria-pressed', String(!real));
  $('posters-real').setAttribute('aria-pressed', String(real));
  $('posters-hint').textContent = real
    ? `Stremio's official artwork, with ${theme.name}'s rows, collection and widescreen spotlight.`
    : 'Every poster drawn in the theme\'s style.';
  showOnTv(id);

  const manifest = presetManifest(info.base, id, real);
  $('install-app').href = stremioLink(manifest);
  $('install-web').href = webInstallLink(manifest);
  $('install-url').textContent = manifest;
  $('qr').innerHTML = qrSvg(`${info.base}/?theme=${id}${real ? '&posters=real' : ''}#install`);
  $('dl-enhanced').href = `themes/${id}.theme.css`;
  $('dl-enhanced').setAttribute('download', `marquee-${id}.theme.css`);
  $('dl-stylus').href = `themes/${id}.user.css`;

  const url = new URL(location.href);
  url.searchParams.set('theme', id);
  if (real) url.searchParams.set('posters', 'real');
  else url.searchParams.delete('posters');
  history.replaceState(null, '', url);
  if (jump) $('install').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

for (const [btn, value] of [['posters-art', false], ['posters-real', true]]) {
  $(btn).addEventListener('click', () => {
    real = value;
    store.set('real-posters', real);
    select(current);
  });
}
$('copy-url').addEventListener('click', () => copyText($('install-url').textContent, 'Install link'));

if (info.builtAt) {
  const when = new Date(info.builtAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  $('freshness').textContent = `Trending rows last refreshed ${when}; they update every day.`;
}

// --- Custom add-ons published from the Studio --------------------------------------------
async function buildMine() {
  const addons = await json('addons.json');
  if (!addons?.custom?.length) return;
  $('mine').hidden = false;
  for (const a of addons.custom) {
    const theme = getTheme(a.theme);
    $('mine-list').append(h('article', { class: 'card', style: cardVars(theme.palette) },
      h('div', { class: 'card-shot' }, h('img', { src: `previews/${a.slug}.${ext}`, alt: `${a.name} on a Stremio home screen`, loading: 'lazy' })),
      h('div', { class: 'card-body' },
        h('h3', {}, a.name),
        h('p', {}, `Based on ${theme.emoji} ${theme.name}`),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn small', href: stremioLink(a.manifest) }, 'Install'),
          h('a', { class: 'btn small ghost', href: webInstallLink(a.manifest), target: '_blank', rel: 'noopener' }, 'Web'),
          h('a', { class: 'btn small ghost', href: `addon/${a.slug}/configure/` }, 'Edit')))));
  }
}

// --- Poster wall: the same three trending titles, drawn by all eight themes ------------
async function buildWall() {
  const wall = $('wall');
  wall.classList.add('wall');
  const lists = await Promise.all(THEMES.map((t) =>
    json(`addon/${t.id}/catalog/movie/mq-movies.json`).then((j) => j?.metas.slice(0, 3) || [])));
  for (let row = 0; row < 3; row++) {
    THEMES.forEach((t, col) => {
      const meta = lists[col][row];
      // Catalog URLs are absolute (Stremio needs that); load them relative to this page.
      const src = meta?.poster.startsWith(`${info.base}/`) ? meta.poster.slice(info.base.length + 1) : meta?.poster;
      if (meta) wall.append(h('img', { src, alt: `${meta.name} in the ${t.name} theme`, loading: 'lazy' }));
    });
  }
}

select(current);
buildMine();
buildWall();
