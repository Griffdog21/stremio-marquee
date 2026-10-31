// Serve dist/ exactly like GitHub Pages would (static files + CORS), for
// previewing a build locally: `npm run serve` → http://127.0.0.1:8080/
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf',
  '.txt': 'text/plain',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = path.resolve(DIST, `.${decodeURIComponent(url.pathname)}`);
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'access-control-allow-origin': '*' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => console.log(`Serving dist/ on http://127.0.0.1:${PORT}/`));
