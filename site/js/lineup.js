// Lineup: reorder the add-ons in a Stremio account (which orders the home
// screen rows) and hide individual rows. Talks only to api.strem.io.
import { applyTheme, download, h, seasonalTheme, store, toast } from './common.js';
import { CINEMETA, boardRows, setRow } from '../core/lineup.js';

const API = 'https://api.strem.io/api';
const $ = (id) => document.getElementById(id);

applyTheme(store.get('theme', seasonalTheme()));

let authKey = '';
let loaded = []; // the collection exactly as Stremio returned it
let addons = []; // the working copy being edited
const reference = new Map(); // transportUrl → full catalog list, for re-enabling hidden rows
const touched = new Set(); // transportUrls whose rows were changed

async function api(method, body) {
  // A plain-text body keeps this a "simple" CORS request (no preflight).
  const res = await fetch(`${API}/${method}`, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (data.error) throw new Error(data.error.message || 'Stremio rejected the request');
  if (!res.ok || !('result' in data)) throw new Error(`Unexpected response from Stremio (${res.status})`);
  return data.result;
}

const isMarquee = (a) => String(a.manifest?.id || '').startsWith('community.marquee');
const clone = (x) => JSON.parse(JSON.stringify(x));

function say(id, text, kind = '') {
  $(id).textContent = text;
  $(id).className = `status ${kind}`;
}

// --- Connecting ------------------------------------------------------------------------
async function connect(key) {
  authKey = key;
  say('connect-status', 'Loading your add-ons…');
  try {
    const result = await api('addonCollectionGet', { type: 'AddonCollectionGet', authKey, update: true });
    if (!Array.isArray(result.addons)) throw new Error('No add-on list in the response');
    loaded = clone(result.addons);
    addons = clone(result.addons);
    touched.clear();
    $('connect').hidden = true;
    $('editor').hidden = false;
    say('save-status', `${addons.length} add-ons loaded. Rearrange, then Save.`);
    rememberCatalogs();
    render();
    fetchLiveCatalogs();
  } catch (err) {
    authKey = '';
    say('connect-status', `Couldn't load your add-ons: ${err.message}`, 'bad');
  }
}

$('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-btn').disabled = true;
  say('connect-status', 'Signing in…');
  try {
    const result = await api('login', { type: 'Login', email: $('email').value.trim(), password: $('password').value, facebook: false });
    $('password').value = '';
    if (!result.authKey) throw new Error('No session returned');
    await connect(result.authKey);
  } catch (err) {
    say('connect-status', `Sign-in failed: ${err.message}`, 'bad');
  } finally {
    $('login-btn').disabled = false;
  }
});

$('key-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const key = $('authkey').value.replace(/"/g, '').trim();
  if (key) connect(key);
});

$('disconnect').addEventListener('click', () => {
  authKey = '';
  loaded = [];
  addons = [];
  $('editor').hidden = true;
  $('connect').hidden = false;
  say('connect-status', 'Disconnected.');
});

// --- Remembering every row an add-on offers ---------------------------------------------
function rememberCatalogs() {
  const saved = store.get('lineup-catalogs', {});
  for (const a of addons) {
    const now = a.manifest?.catalogs || [];
    const prev = saved[a.transportUrl] || [];
    const best = prev.length > now.length ? prev : now;
    reference.set(a.transportUrl, best);
    saved[a.transportUrl] = best;
  }
  store.set('lineup-catalogs', saved);
}

// Ask each add-on for its current manifest so hidden rows can be brought back.
async function fetchLiveCatalogs() {
  await Promise.all(addons.map(async (a) => {
    if (!/^https:\/\//.test(a.transportUrl)) return;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const manifest = await fetch(a.transportUrl, { signal: ctrl.signal }).then((r) => r.json());
      clearTimeout(timer);
      if (Array.isArray(manifest.catalogs) && manifest.catalogs.length >= (reference.get(a.transportUrl) || []).length) {
        reference.set(a.transportUrl, manifest.catalogs);
      }
    } catch {
      // Unreachable add-ons keep the remembered list.
    }
  }));
  render();
}

// --- Editing -----------------------------------------------------------------------------
function dirty() {
  $('save').disabled = JSON.stringify(addons.map((a) => [a.transportUrl, a.manifest?.catalogs])) ===
    JSON.stringify(loaded.map((a) => [a.transportUrl, a.manifest?.catalogs]));
}

function move(from, to) {
  if (to < 0 || to >= addons.length) return;
  const [a] = addons.splice(from, 1);
  addons.splice(to, 0, a);
  render();
}

function setCatalog(addon, catalog, show) {
  const ref = reference.get(addon.transportUrl) || [];
  addon.manifest = { ...addon.manifest, catalogs: setRow(addon.manifest.catalogs || [], ref, catalog, show) };
  touched.add(addon.transportUrl);
  render();
}

$('marquee-top').addEventListener('click', () => {
  const ours = addons.filter(isMarquee);
  if (!ours.length) return toast('No Marquee add-on installed yet');
  addons = [...ours, ...addons.filter((a) => !isMarquee(a))];
  render();
  toast('Marquee moved to the top. Save to apply');
});

// Marquee's Trending rows mirror Cinemeta's Popular ones, so most people want
// Cinemeta's off the home screen. Search keeps working (see core/lineup.js).
$('hide-cinemeta').addEventListener('click', () => {
  const cinemeta = addons.find((a) => a.manifest?.id === CINEMETA);
  if (!cinemeta) return toast('Cinemeta isn\'t in this account');
  for (const { catalog, shown } of boardRows(cinemeta.manifest.catalogs || [], reference.get(cinemeta.transportUrl) || [])) {
    if (shown) setCatalog(cinemeta, catalog, false);
  }
  toast('Cinemeta\'s rows hidden; search still works. Save to apply');
});

function render() {
  $('addons').replaceChildren(...addons.map((a, i) => {
    const m = a.manifest || {};
    const rows = boardRows(m.catalogs || [], reference.get(a.transportUrl) || []);
    const shownCount = rows.filter((r) => r.shown).length;
    return h('article', { class: `addon${isMarquee(a) ? ' marquee' : ''}` },
      h('div', { class: 'addon-head' },
        h('span', { class: 'pos' }, String(i + 1)),
        h('img', { src: m.logo || 'favicon.svg', alt: '', loading: 'lazy', onerror: (e) => { e.target.src = 'favicon.svg'; } }),
        h('div', {},
          h('b', {}, m.name || a.transportName || 'Add-on',
            a.flags?.official ? h('span', { class: 'pill' }, 'official') : null,
            a.flags?.protected ? h('span', { class: 'pill' }, 'protected') : null),
          h('small', {}, rows.length ? `${shownCount} of ${rows.length} home rows shown` : 'No home rows (streams, subtitles or search only)')),
        h('div', { class: 'move' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${m.name} to the top`, disabled: i === 0, onclick: () => move(i, 0) }, '⤒'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${m.name} up`, disabled: i === 0, onclick: () => move(i, i - 1) }, '↑'),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Move ${m.name} down`, disabled: i === addons.length - 1, onclick: () => move(i, i + 1) }, '↓'))),
      rows.length ? h('div', { class: 'addon-catalogs' }, ...rows.map(({ catalog: c, shown, keepsSearch }) => {
        const box = h('input', { type: 'checkbox', checked: shown });
        box.addEventListener('change', () => setCatalog(a, c, box.checked));
        return h('label', { class: 'catalog-toggle' }, box, h('span', { class: 'type' }, c.type), c.name || c.id,
          !shown && keepsSearch ? h('span', { class: 'pill' }, 'still searchable') : null);
      })) : null);
  }));
  dirty();
}

// --- Backups and saving -------------------------------------------------------------------
function backupFile(list) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  download(`stremio-addons-backup-${stamp}.json`, JSON.stringify(list, null, 2), 'application/json');
}

$('backup').addEventListener('click', () => backupFile(loaded));

$('restore').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const list = JSON.parse(await file.text());
    const valid = Array.isArray(list) && list.length && list.every((a) => typeof a?.transportUrl === 'string' && a.manifest && typeof a.manifest === 'object');
    if (!valid) throw new Error('That file isn\'t a Stremio add-on backup');
    addons = clone(list);
    addons.forEach((a) => touched.add(a.transportUrl));
    render();
    say('save-status', 'Backup loaded. Review it, then Save to Stremio to apply.', 'good');
  } catch (err) {
    say('save-status', err.message, 'bad');
  }
});

$('save').addEventListener('click', async () => {
  if (!window.confirm('Save this lineup to your Stremio account? A backup of your current add-ons downloads first.')) return;
  $('save').disabled = true;
  say('save-status', 'Saving…');
  try {
    backupFile(loaded);
    // Start from what Stremio has right now, so add-ons installed meanwhile survive.
    const current = (await api('addonCollectionGet', { type: 'AddonCollectionGet', authKey, update: false })).addons || [];
    const byUrl = new Map(current.map((a) => [a.transportUrl, a]));
    const ours = new Map(addons.map((a) => [a.transportUrl, a]));
    const next = [];
    for (const a of addons) {
      const live = byUrl.get(a.transportUrl);
      if (!live) continue; // Uninstalled elsewhere since loading.
      next.push(touched.has(a.transportUrl) ? { ...live, manifest: { ...live.manifest, catalogs: a.manifest.catalogs } } : live);
    }
    for (const a of current) if (!ours.has(a.transportUrl)) next.push(a);
    if (!next.length) throw new Error('Refusing to save an empty add-on list');
    const result = await api('addonCollectionSet', { type: 'AddonCollectionSet', authKey, addons: next });
    if (result && result.success === false) throw new Error(result.error || 'Stremio refused the change');
    loaded = clone(next);
    addons = clone(next);
    touched.clear();
    render();
    say('save-status', 'Saved! Restart Stremio on your TV to see the new lineup.', 'good');
  } catch (err) {
    say('save-status', `Couldn't save: ${err.message}`, 'bad');
    dirty();
  }
});
