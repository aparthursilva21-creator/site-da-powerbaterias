import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../dist', import.meta.url));
const pagesPrefix = '/site-da-powerbaterias/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json'
};

const { values } = parseArgs({
  options: { host: { type: 'string' }, port: { type: 'string' }, strictPort: { type: 'boolean' } }
});
const port = Number(values.port || process.env.PORT || 3000);
const host = values.host || '0.0.0.0';
createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let path;
  try {
    path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (path.startsWith(pagesPrefix)) path = path.slice(pagesPrefix.length);
  if (path.endsWith('/') || !path) path += 'index.html';
  let file = resolve(root, `./${path}`);
  if (!file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }

  let code = 200;
  let info;
  try {
    info = await stat(file);
    if (!info.isFile()) throw new Error('Não é um arquivo.');
  } catch {
    file = resolve(root, '404.html');
    info = await stat(file).catch(() => null);
    code = 404;
  }
  if (!info) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(code, {
    'Content-Type': types[extname(file)] || 'application/octet-stream',
    'Content-Length': info.size,
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`Power Baterias em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
});
