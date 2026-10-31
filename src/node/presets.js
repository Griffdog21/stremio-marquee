// Custom add-ons published as files: presets/<slug>.json holds a Studio
// configuration, and the static build turns each into /addon/<slug>/ on
// GitHub Pages: free hosting for fully custom setups, no server needed.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { THEME_IDS } from '../core/themes.js';
import { normalizeConfig } from '../core/config.js';

export const SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Stock themes and their real-poster twins own these addresses.
const RESERVED = new Set(THEME_IDS.flatMap((id) => [id, `${id}-classic`]));

export function loadPresets(dir) {
  const presets = [];
  const errors = [];
  if (!existsSync(dir)) return { presets, errors };
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const slug = file.slice(0, -'.json'.length);
    if (!SLUG.test(slug) || RESERVED.has(slug)) {
      errors.push({ file, message: 'Name the file with lowercase letters, numbers and dashes (e.g. my-setup.json), and not after a stock theme.' });
      continue;
    }
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('expected a JSON object');
      presets.push({ slug, cfg: normalizeConfig(raw) });
    } catch (err) {
      errors.push({ file, message: `Not valid JSON: ${err.message}` });
    }
  }
  return { presets, errors };
}
