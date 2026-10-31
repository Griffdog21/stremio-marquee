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

const $ = (id) => document.getElementById(id);

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

// --- TV preview with a crossfade between themes -------------------------------------
function showOnTv(id) {
  const screen = $('tv-screen');
  const img = h('img', { class: 'layer', src: `previews/${id}.${ext}`, alt: `${getTheme(id).name} on a Stremio home screen`, style: 'opacity:0' });
  img.addEventListener('load', () => {
    requestAnimationFrame(() => { img.style.opacity = '1'; });
    setTimeout(() => screen.querySelectorAll('img').forEach((x) => x !== img && x.remove()), 800);
  });
  screen.append(img);
}

function select(id, jump = false) {
  current = id;
  store.set('theme', id);
  const theme = getTheme(id);
  applyTheme(id);
  $('now-showing').textContent = theme.name;
  $('install-name').textContent = theme.name;
  $('tv-caption').textContent = `${theme.emoji} ${theme.name} · Stremio home screen`;
  document.querySelectorAll('.theme-name').forEach((el) => { el.textContent = theme.name; });
  document.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-current', String(c.dataset.theme === id)));
  showOnTv(id);

  const manifest = presetManifest(info.base, id);
  $('install-app').href = stremioLink(manifest);
  $('install-web').href = webInstallLink(manifest);
  $('install-url').textContent = manifest;
  $('qr').innerHTML = qrSvg(`${info.base}/?theme=${id}#install`);
  $('dl-enhanced').href = `themes/${id}.theme.css`;
  $('dl-enhanced').setAttribute('download', `marquee-${id}.theme.css`);
  $('dl-stylus').href = `themes/${id}.user.css`;

  const url = new URL(location.href);
  url.searchParams.set('theme', id);
  history.replaceState(null, '', url);
  if (jump) $('install').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

$('copy-url').addEventListener('click', () => copyText($('install-url').textContent, 'Install link'));

// --- Poster wall: the same three trending titles, drawn by all eight themes ------------
async function buildWall() {
  const wall = $('wall');
  wall.classList.add('wall');
  const lists = await Promise.all(THEMES.map((t) =>
    fetch(`addon/${t.id}/catalog/movie/mq-movies.json`).then((r) => r.json()).then((j) => j.metas.slice(0, 3)).catch(() => [])));
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
buildWall();
