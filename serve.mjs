import { createServer } from 'http';
import { readFile, stat, open } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3000;

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
};

/* Browsers request video with a Range header and expect a 206 back; without it
   playback stalls or seeking breaks, so the reel strip needs this path. */
async function serveRange(req, res, filePath, size, type) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (!m) return false;

  let start = m[1] === '' ? null : parseInt(m[1], 10);
  let end = m[2] === '' ? null : parseInt(m[2], 10);
  if (start === null && end === null) return false;
  if (start === null) { start = Math.max(0, size - end); end = size - 1; }   // suffix range
  if (end === null || end > size - 1) end = size - 1;

  if (start > end || start >= size) {
    res.writeHead(416, { 'Content-Range': `bytes */${size}` });
    res.end();
    return true;
  }

  const fh = await open(filePath, 'r');
  res.writeHead(206, {
    'Content-Type': type,
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
  });
  fh.createReadStream({ start, end }).pipe(res).on('close', () => fh.close());
  return true;
}

createServer(async (req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  urlPath = decodeURIComponent(urlPath.split('?')[0]);
  const filePath = join(__dirname, urlPath);
  const ext = extname(filePath);
  const type = mime[ext] || 'text/plain';

  try {
    if (type.startsWith('video/')) {
      const { size } = await stat(filePath);
      if (await serveRange(req, res, filePath, size, type)) return;
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
      res.end(await readFile(filePath));
      return;
    }

    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
