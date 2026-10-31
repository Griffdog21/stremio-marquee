// Run Marquee as a normal Node server: `npm start` (after `npm run build:site`).
import http from 'node:http';
import { createHandler } from './handler.js';

const port = Number(process.env.PORT) || 7000;
const server = http.createServer(createHandler({ publicUrl: process.env.PUBLIC_URL }));
server.listen(port, () => {
  console.log(`Marquee is running: http://127.0.0.1:${port}/  (addon: http://127.0.0.1:${port}/manifest.json)`);
});
