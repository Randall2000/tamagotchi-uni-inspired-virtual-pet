import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
};
// Only the web app itself is public; .env.local, .git and other project files are never served.
const publicFiles = new Set(['/index.html', '/styles.css', '/app.js', '/motion.js', '/roaming.js', '/navigation.js', '/pet.js']);
const assetDir = join(root, 'public', 'assets') + sep;

export function resolvePublicPath(url = '/') {
  const requested = url === '/' ? '/index.html' : decodeURIComponent(url.split('?')[0]);
  const localPath = requested.startsWith('/assets/') ? `/public${requested}` : requested;
  const file = normalize(join(root, localPath));
  if (publicFiles.has(requested)) return file;
  return file.startsWith(assetDir) && types[extname(file)] ? file : null;
}

export const server = createServer(async (req, res) => {
  let file = null;
  try { file = resolvePublicPath(req.url); } catch { /* Malformed URL encoding. */ }
  if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => console.log(`Pet demo running at http://localhost:${port}`));
}
