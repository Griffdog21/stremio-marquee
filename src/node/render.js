// SVG → PNG with resvg, using only the bundled fonts so output is identical on
// every machine (GitHub Actions, Docker, Vercel, your laptop).
import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FONTS } from '../core/fonts.js';

const FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fonts');
const FONT_FILES = [...new Set(Object.values(FONTS).map((f) => path.join(FONT_DIR, f.file)))];

export function svgToPng(svg, { width } = {}) {
  const resvg = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONTS.barlow.family },
    shapeRendering: 2,
    textRendering: 1,
  });
  return resvg.render().asPng();
}

export { FONT_DIR, FONT_FILES };
