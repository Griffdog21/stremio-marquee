import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, SHAPES, renderArt, renderLogo, renderBackdrop } from '../src/core/art/index.js';
import { renderBoard } from '../src/core/board.js';
import { fitText, measure } from '../src/core/text.js';
import { getTheme, themeForTemplate, THEMES } from '../src/core/themes.js';
import { FONTS } from '../src/core/fonts.js';
import { svgToPng } from '../src/node/render.js';

const EDGE_CASES = [
  { id: 'tt0083658', type: 'movie', name: 'Blade Runner', year: '1982', genres: ['Action', 'Sci-Fi'], rating: 8.1 },
  { id: 'tt0903747', type: 'series', name: 'Breaking Bad', year: '2008', releaseInfo: '2008–2013', genres: ['Crime'], rating: 9.5 },
  { id: 'tt9999990', type: 'movie', name: 'Night of the Day of the Dawn of the Son of the Bride of the Return of the Revenge of the Terror', year: '', genres: [], rating: null },
  { id: 'tt9999991', type: 'movie', name: 'Amélie & <Friends> "Quoted"', year: '2001', genres: ['Comedy'], rating: 0 },
  { id: 'tt9999992', type: 'movie', name: 'Supercalifragilisticexpialidocious', year: '1964', genres: ['Family'], rating: 7.1 },
  { id: '', type: 'movie', name: '', year: '', genres: [] },
];

// PNG width/height live at fixed offsets in the IHDR chunk.
const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test('every template renders every shape for awkward titles', () => {
  for (const template of Object.keys(TEMPLATES)) {
    const palette = themeForTemplate(template).palette;
    for (const [shape, [w, h]] of Object.entries(SHAPES)) {
      for (const item of EDGE_CASES) {
        const svg = renderArt({ template, palette, item, shape });
        assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), `${template}/${shape}`);
        assert.ok(!svg.includes('NaN') && !svg.includes('undefined'), `${template}/${shape} "${item.name}" has bad numbers`);
        assert.ok(!svg.includes('<Friends>'), 'titles are XML-escaped');
        if (item === EDGE_CASES[2]) {
          const png = svgToPng(svg);
          assert.deepEqual(pngSize(png), [w, h], `${template}/${shape} rasterises at size`);
        }
      }
    }
  }
});

test('art is deterministic per title', () => {
  const a = renderArt({ template: 'bauhaus', palette: getTheme('bauhaus').palette, item: EDGE_CASES[0] });
  const b = renderArt({ template: 'bauhaus', palette: getTheme('bauhaus').palette, item: EDGE_CASES[0] });
  assert.equal(a, b);
});

test('text fitting never exceeds its box (or squeezes when it must)', () => {
  for (const font of Object.keys(FONTS)) {
    for (const item of EDGE_CASES) {
      const fit = fitText(item.name || 'Untitled', { font, maxWidth: 240, maxHeight: 120, maxLines: 3, maxSize: 60, minSize: 10 });
      assert.ok(fit.lines.length <= 3, `${font}: ${fit.lines.length} lines`);
      fit.lines.forEach((line, i) => {
        const width = measure(font, line, fit.size, fit.ls);
        assert.ok(width <= 240.5 || fit.widths[i] > fit.maxWidth, `${font}: "${line}" is ${width}px`);
      });
    }
  }
});

test('logos, backdrops and board previews render for every theme', () => {
  for (const t of THEMES) {
    assert.deepEqual(pngSize(svgToPng(renderLogo({ palette: t.palette, template: t.template, size: 256 }))), [256, 256]);
    assert.ok(renderBackdrop({ template: t.template, palette: t.palette, name: t.name }).includes('<svg'));
    const board = renderBoard({ template: t.template, palette: t.palette, rows: [{ name: 'Row', shape: 'poster', items: EDGE_CASES }], idPrefix: t.id });
    assert.ok(board.includes('Row'));
  }
});
