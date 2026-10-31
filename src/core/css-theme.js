// Full UI themes for the Stremio apps that accept CSS: Stremio Enhanced
// (desktop) and web.stremio.com via the Stylus extension. They restyle Stremio's
// own CSS custom properties, so they survive most Stremio updates.
import { getTheme, displayFont, PALETTE_KEYS } from './themes.js';
import { mix, rgba, luminance, lighten } from './util.js';
import { VERSION } from './version.js';

const GOOGLE_FONTS = {
  'Bebas Neue': 'Bebas+Neue',
  'Abril Fatface': 'Abril+Fatface',
  Limelight: 'Limelight',
  'Permanent Marker': 'Permanent+Marker',
  'Archivo Black': 'Archivo+Black',
  VT323: 'VT323',
  Creepster: 'Creepster',
  Syncopate: 'Syncopate:wght@700',
  Monoton: 'Monoton',
  'Poiret One': 'Poiret+One',
  Marcellus: 'Marcellus',
  Rye: 'Rye',
  Bangers: 'Bangers',
  'Press Start 2P': 'Press+Start+2P',
  UnifrakturMaguntia: 'UnifrakturMaguntia',
};

// How big the display face should be for row titles (condensed faces run larger).
const TITLE_SIZE = {
  'Bebas Neue': '1.9rem',
  'Abril Fatface': '1.45rem',
  Limelight: '1.35rem',
  'Permanent Marker': '1.4rem',
  'Archivo Black': '1.35rem',
  VT323: '1.9rem',
  Creepster: '1.7rem',
  Syncopate: '1.05rem',
  Monoton: '1.5rem',
  'Poiret One': '1.55rem',
  Marcellus: '1.5rem',
  Rye: '1.35rem',
  Bangers: '1.8rem',
  'Press Start 2P': '0.95rem',
  UnifrakturMaguntia: '1.75rem',
};

const ROW_TITLE = '[class*="meta-row-container"] [class*="header-container"] [class*="title-container"]';
const POSTER = '[class*="meta-item-container"] [class*="poster-container"]';
const FOCUSED = ['.active', '.hovered', '.selected', ':focus-within']
  .map((s) => `[class*="meta-item-container"]${s} [class*="poster-container"]`)
  .join(',\n');

const SCANLINES = (alpha) => `html body::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; background: repeating-linear-gradient(0deg, ${alpha} 0 1px, transparent 1px 3px); }`;
const GREYSCALE = `${POSTER} img { filter: grayscale(1) contrast(1.12) brightness(0.92); transition: filter 0.35s ease; }
[class*="meta-item-container"]:hover [class*="poster-container"] img,
${FOCUSED.split(',\n').map((s) => `${s} img`).join(',\n')} { filter: none; }`;

// Per-theme extras on top of the art style's look.
function themeExtras(themeId) {
  // Noir and Monochrome: posters fall to black and white until you look at them.
  if (themeId === 'noir' || themeId === 'mono') return GREYSCALE;
  return '';
}

function signature(template, p, font) {
  const caps = font !== 'UnifrakturMaguntia'; // blackletter capitals are unreadable
  switch (template) {
    case 'neon':
      return `${ROW_TITLE} { text-shadow: 0 0 8px ${rgba(p.primary, 0.9)}, 0 0 22px ${rgba(p.primary, 0.6)}; color: ${lighten(p.primary, 0.82)}; }`;
    case 'noir':
      return `${caps ? `${ROW_TITLE} { text-transform: uppercase; letter-spacing: 0.06em; }` : ''}
${ROW_TITLE}::before { content: ''; display: inline-block; width: 1.6rem; height: 0.2rem; background: ${p.accent}; margin-right: 0.8rem; vertical-align: middle; }`;
    case 'deco':
      return `${ROW_TITLE} { text-transform: uppercase; letter-spacing: 0.12em; background: linear-gradient(180deg, ${lighten(p.primary, 0.6)}, ${p.primary} 55%, ${mix(p.primary, '#000000', 0.35)}); -webkit-background-clip: text; background-clip: text; color: transparent; }`;
    case 'vhs':
      return `${ROW_TITLE} { transform: rotate(-1.2deg); color: ${p.text}; }
${SCANLINES('rgba(255,255,255,0.025)')}`;
    case 'bauhaus':
      return `${ROW_TITLE} { text-transform: lowercase; letter-spacing: -0.01em; }
${ROW_TITLE}::before { content: ''; display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 50%; background: ${p.primary}; margin-right: 0.7rem; }`;
    case 'terminal':
      return `${ROW_TITLE} { text-transform: uppercase; text-shadow: 0 0 6px ${rgba(p.primary, 0.8)}; color: ${p.primary}; }
${ROW_TITLE}::before { content: '> '; }
${SCANLINES('rgba(0,0,0,0.18)')}`;
    case 'haunt':
      return `${ROW_TITLE} { color: ${p.primary}; text-shadow: 0 0 14px ${rgba(p.primary, 0.55)}; letter-spacing: 0.03em; }`;
    case 'aurora':
      return `${ROW_TITLE} { text-transform: uppercase; letter-spacing: 0.16em; background: linear-gradient(90deg, ${p.primary}, ${p.secondary}, ${p.accent}); -webkit-background-clip: text; background-clip: text; color: transparent; }`;
    case 'sakura':
      return `${ROW_TITLE} { color: ${p.text}; letter-spacing: 0.04em; }
${ROW_TITLE}::before { content: ''; display: inline-block; width: 0.75rem; height: 0.75rem; border-radius: 0 70% 0 70%; background: ${p.primary}; margin-right: 0.7rem; transform: rotate(-20deg); }`;
    case 'wanted':
      return `${ROW_TITLE} { text-transform: uppercase; letter-spacing: 0.08em; color: ${p.primary}; text-shadow: 0 2px 0 ${rgba('#000000', 0.5)}; }`;
    case 'pop':
      return `${ROW_TITLE} { text-transform: uppercase; letter-spacing: 0.04em; color: ${p.primary}; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; transform: rotate(-1.5deg); }`;
    case 'arcade':
      return `${ROW_TITLE} { text-transform: uppercase; color: ${p.accent}; text-shadow: 3px 3px 0 ${p.primary}; }
${SCANLINES('rgba(0,0,0,0.16)')}`;
    default:
      return '';
  }
}

export function themeCssBody({ themeId, palette, template }) {
  const theme = getTheme(themeId);
  const p = {};
  for (const k of PALETTE_KEYS) p[k] = palette?.[k] || theme.palette[k];
  const tpl = template || theme.template;
  const font = displayFont(theme.id, template);
  const light = luminance(p.bg) > 0.45;
  return {
    imports: GOOGLE_FONTS[font] ? `@import url('https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[font]}&display=swap');` : '',
    css: `:root {
  --primary-background-color: ${p.bg};
  --secondary-background-color: ${p.surface};
  --primary-foreground-color: ${rgba(p.text, 0.92)};
  --secondary-foreground-color: ${p.bg};
  --primary-accent-color: ${p.primary};
  --secondary-accent-color: ${p.secondary};
  --tertiary-accent-color: ${p.accent};
  --overlay-color: ${light ? 'rgba(0, 0, 0, 0.06)' : rgba(p.text, 0.06)};
  --modal-background-color: ${mix(p.bg, p.surface, 0.6)};
  --outer-glow: 0px 0px 18px ${rgba(p.primary, 0.45)};
  --color-placeholder-background: ${rgba(p.primary, 0.12)};
}

html body {
  background:
    radial-gradient(120% 80% at 85% -10%, ${rgba(p.primary, light ? 0.12 : 0.2)} 0%, transparent 55%),
    radial-gradient(90% 70% at -10% 110%, ${rgba(p.secondary, light ? 0.1 : 0.16)} 0%, transparent 60%),
    linear-gradient(160deg, ${p.bg} 0%, ${p.surface} 100%) !important;
}

${ROW_TITLE} {
  font-family: '${font}', 'PlusJakartaSans', sans-serif;
  font-size: ${TITLE_SIZE[font] || '1.4rem'};
  font-weight: 400;
}

${FOCUSED} {
  box-shadow: 0 0 0 0.2rem ${p.primary}, 0 0 1.6rem ${rgba(p.primary, 0.55)} !important;
}

${signature(tpl, p, font)}
${themeExtras(theme.id)}
`,
  };
}

export function enhancedTheme({ themeId, palette, template, name, base }) {
  const theme = getTheme(themeId);
  const { imports, css } = themeCssBody({ themeId, palette, template });
  const update = base ? `${base}/themes/${theme.id}.theme.css` : 'none';
  return `/**
 * @name Marquee ${name || theme.name}
 * @description ${theme.tagline} Matches the Marquee addon's ${theme.name} posters. https://github.com/Griffdog21/stremio-marquee
 * @updateUrl ${update}
 * @version ${VERSION}
 * @author Marquee
 */
${imports}

${css}`;
}

export function stylusTheme({ themeId, palette, template, name, base }) {
  const theme = getTheme(themeId);
  const { imports, css } = themeCssBody({ themeId, palette, template });
  const update = base ? `\n@updateURL     ${base}/themes/${theme.id}.user.css` : '';
  return `/* ==UserStyle==
@name          Marquee · ${name || theme.name} for Stremio Web
@namespace     github.com/Griffdog21/stremio-marquee
@version       ${VERSION}
@description   ${theme.tagline} Matches the Marquee addon's ${theme.name} posters.
@author        Marquee
@license       MIT
@homepageURL   https://github.com/Griffdog21/stremio-marquee${update}
==/UserStyle== */
${imports}

@-moz-document domain("web.stremio.com") {
${css.replace(/^/gm, '  ').replace(/^\s+$/gm, '')}
}
`;
}
