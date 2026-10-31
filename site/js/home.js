import { THEMES, GROUPS, getTheme } from '../core/themes.js';
import {
  applyTheme, cardVars, siteInfo, presetManifest, stremioLink, webInstallLink, qrSvg, copyText, seasonalTheme, SEASON_BADGES, store, h,
} from './common.js';

const info = await siteInfo();
const ext = info.imageExt || 'jpg';
const params = new URLSearchParams(location.search);
const inSeason = seasonalTheme();
let current = params.get('theme') || store.get('theme', seasonalTheme());
if (!THEMES.some((t) => t.id === current)) current = seasonalTheme();
// Real posters by default; generated art is the opt-in.
let real = params.has('posters') ? params.get('posters') !== 'art' : store.get('real-posters', true);

const $ = (id) => document.getElementById(id);
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// --- Gallery ------------------------------------------------------------------
for (const t of THEMES) {
  $('gallery').append(h('article', { class: 'card', style: cardVars(t.palette), 'data-theme': t.id, 'data-group': t.group },
    h('button', { class: 'card-select', type: 'button', 'aria-label': `Preview ${t.name}`, onclick: () => select(t.id, true) }),
    t.id === inSeason && SEASON_BADGES[t.id] ? h('span', { class: 'badge' }, SEASON_BADGES[t.id]) : null,
    h('div', { class: 'card-shot' },
      h('img', { 'data-theme': t.id, src: `previews/${t.id}.${ext}`, alt: `${t.name} theme on a Stremio home screen`, loading: 'lazy', width: 1280, height: 720 })),
    h('div', { class: 'card-body' },
      h('h3', {}, `${t.emoji} ${t.name}`),
      h('p', {}, t.tagline),
      h('div', { class: 'swatches', 'aria-hidden': 'true' },
        ...['bg', 'surface', 'primary', 'secondary', 'accent'].map((k) => h('i', { style: `background:${t.palette[k]}` }))),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn small card-install', 'data-theme': t.id, href: stremioLink(presetManifest(info.base, t.id, real)) }, 'Install'),
        h('a', { class: 'btn small ghost', href: `studio.html?theme=${t.id}` }, 'Customize')))));
}

// Filter chips: 25 themes is a lot to scroll, so they come in groups.
function filterGallery(group) {
  document.querySelectorAll('#theme-filter .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.group === group)));
  document.querySelectorAll('#gallery .card').forEach((c) => { c.hidden = group !== 'all' && c.dataset.group !== group; });
}
$('theme-filter').append(...[{ id: 'all', name: `All ${THEMES.length}` }, ...GROUPS].map((g) =>
  h('button', { class: 'chip', type: 'button', 'data-group': g.id, 'aria-pressed': String(g.id === 'all'), onclick: () => filterGallery(g.id) }, g.name)));

// --- TV preview -------------------------------------------------------------------------
// Pre-rendered home screens: previews/<id> shows real posters, <id>-art theme art.
const previewOf = (id) => `previews/${id}${real ? '' : '-art'}.${ext}`;

function showOnTv(id) {
  const screen = $('tv-screen');
  const layer = h('img', { class: 'layer', src: previewOf(id), alt: `${getTheme(id).name} on a Stremio home screen`, style: 'opacity:0' });
  layer.addEventListener('load', () => requestAnimationFrame(() => { layer.style.opacity = '1'; }));
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
    ? `The official posters, with ${theme.name}'s rows, collection and widescreen spotlight. Generated art only fills in where a title has no poster.`
    : 'Every poster drawn in the theme\'s style.';
  document.querySelectorAll('.card-install').forEach((a) => { a.href = stremioLink(presetManifest(info.base, a.dataset.theme, real)); });
  document.querySelectorAll('.card-shot img[data-theme]').forEach((img) => { img.src = previewOf(img.dataset.theme); });
  showOnTv(id);

  const manifest = presetManifest(info.base, id, real);
  $('install-app').href = stremioLink(manifest);
  $('install-web').href = webInstallLink(manifest);
  $('install-url').textContent = manifest;
  $('qr').innerHTML = qrSvg(`${info.base}/?theme=${id}${real ? '' : '&posters=art'}#install`);
  $('dl-enhanced').href = `themes/${id}.theme.css`;
  $('dl-enhanced').setAttribute('download', `marquee-${id}.theme.css`);
  $('dl-stylus').href = `themes/${id}.user.css`;

  const url = new URL(location.href);
  url.searchParams.set('theme', id);
  if (real) url.searchParams.delete('posters');
  else url.searchParams.set('posters', 'art');
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

// --- Poster wall: real posters from each theme's mood row ------------------------------
async function buildWall() {
  const wall = $('wall');
  wall.classList.add('wall');
  const lists = await Promise.all(THEMES.map((t) =>
    json(`addon/${t.id}-classic/catalog/movie/mq-mood.json`).then((j) => j?.metas.slice(0, 3) || [])));
  // An 8 × 3 grid, dealt round-robin across themes; some themes share a genre, so skip repeats.
  const seen = new Set();
  for (let row = 0; row < 3 && seen.size < 24; row++) {
    THEMES.forEach((t, col) => {
      const meta = lists[col][row];
      if (!meta || seen.has(meta.id) || seen.size >= 24) return;
      seen.add(meta.id);
      // Catalog URLs are absolute (Stremio needs that); load them relative to this page.
      const src = meta.poster.startsWith(`${info.base}/`) ? meta.poster.slice(info.base.length + 1) : meta.poster;
      wall.append(h('img', { src, alt: `${meta.name} (${t.name})`, loading: 'lazy' }));
    });
  }
}

select(current);
buildMine();
buildWall();
