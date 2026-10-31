// Worker thread for the static build: rasterises SVG jobs and writes images.
import { parentPort } from 'node:worker_threads';
import { writeFileSync } from 'node:fs';
import { svgToPng } from '../src/node/render.js';
import { encode } from '../src/node/encode.js';

parentPort.on('message', async ({ id, svg, out, png: keepPng }) => {
  try {
    const png = svgToPng(svg);
    const buf = keepPng ? png : await encode(png);
    writeFileSync(out, buf);
    parentPort.postMessage({ id, ok: true, bytes: buf.length });
  } catch (err) {
    parentPort.postMessage({ id, ok: false, error: `${out}: ${err.message}` });
  }
});
