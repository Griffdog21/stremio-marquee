// Shared helpers for the Marquee website.
import { getTheme, displayFont, PALETTE_KEYS } from '../core/themes.js';
import { readableOn, luminance } from '../core/util.js';
import qrcode from '../vendor/qrcode.mjs';

// Display faces differ wildly in width and height: [scale, tracking, leading].
const DISPLAY = {
  'Bebas Neue': [1, '0.02em', 1.02],
  'Abril Fatface': [0.8, '0', 1.08],
  Limelight: [0.74, '0.02em', 1.12],
  'Permanent Marker': [0.78, '0', 1.12],
  'Archivo Black': [0.74, '-0.01em', 1.06],
  VT323: [1.08, '0.02em', 0.95],
  Creepster: [0.94, '0.03em', 1.05],
  Syncopate: [0.52, '0.06em', 1.35],
  Monoton: [0.62, '0.02em', 1.1],
  'Poiret One': [0.9, '0.04em', 1.08],
  Marcellus: [0.8, '0.02em', 1.1],
  Rye: [0.7, '0', 1.12],
  Bangers: [0.96, '0.03em', 1.02],
  'Press Start 2P': [0.46, '0', 1.45],
  UnifrakturMaguntia: [0.86, '0', 1.08],
};

/** Re-theme the whole page: palette, heading typeface, browser chrome. */
export function applyTheme(themeId, { colors, template } = {}) {
  const theme = getTheme(themeId);
  const p = { ...theme.palette, ...(colors || {}) };
  const root = document.documentElement;
  for (const k of PALETTE_KEYS) root.style.setProperty(`--${k}`, p[k]);
  root.style.setProperty('--on-primary', readableOn(p.primary, '#ffffff', '#111111'));
  const face = displayFont(themeId, template);
  const [scale, tracking, leading] = DISPLAY[face] || [1, '0.02em', 1.05];
  root.style.setProperty('--display', `'${face}', 'Barlow Condensed', sans-serif`);
  root.style.setProperty('--display-scale', scale);
  root.style.setProperty('--display-tracking', tracking);
  root.style.setProperty('--display-leading', leading);
  root.style.colorScheme = luminance(p.bg) > 0.45 ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
  if (!root.classList.contains('themed')) setTimeout(() => root.classList.add('themed'), 100);
  return p;
}

/** CSS custom properties for a card drawn in its own theme's colours. */
export function cardVars(palette) {
  return Object.entries(palette).map(([k, v]) => `--c-${k}:${v}`).join(';') + `;--c-on-primary:${readableOn(palette.primary, '#ffffff', '#111111')}`;
}

export async function siteInfo() {
  try {
    const res = await fetch('site.json', { cache: 'no-cache' });
    if (res.ok) return await res.json();
  } catch {
    // Fall through to a best guess when site.json is missing (local dev).
  }
  return { base: new URL('.', location.href).href.replace(/\/$/, ''), imageExt: 'jpg' };
}

// Every stock theme also ships a real-poster twin at addon/<id>-classic/.
export const presetManifest = (base, id, real = false) => `${base}/addon/${id}${real ? '-classic' : ''}/manifest.json`;
export const stremioLink = (url) => url.replace(/^https?:\/\//, 'stremio://');
export const webInstallLink = (url) => `https://web.stremio.com/#/addons?addon=${encodeURIComponent(url)}`;

export function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'QR code' });
}

let toastTimer;
export function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

export async function copyText(text, what = 'Link') {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`);
  } catch {
    window.prompt('Copy this:', text);
  }
}

export function download(filename, text, type = 'text/css') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The site opens on a theme for the season: Halloween in October, snow over
// the holidays, blossom in spring, neon the rest of the year.
const SEASONS = { 9: 'haunt', 11: 'snowfall', 0: 'snowfall', 2: 'sakura', 3: 'sakura' };
export const seasonalTheme = () => SEASONS[new Date().getMonth()] || 'neon';
export const SEASON_BADGES = { haunt: 'Halloween pick', snowfall: 'Winter pick', sakura: 'Spring pick' };

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`marquee:${key}`);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`marquee:${key}`, JSON.stringify(value));
    } catch {
      // Private mode or blocked storage: preferences just won't persist.
    }
  },
};

/** Tiny element helper: h('a', { href: '#', class: 'btn' }, 'Text'). */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
