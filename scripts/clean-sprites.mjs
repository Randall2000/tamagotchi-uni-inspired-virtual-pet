// Cleans background-removal leftovers from the character atlases, in place.
// 1. Alpha is made binary: < 128 becomes fully transparent (soft shadows, haze,
//    stray specks), >= 128 becomes fully opaque (hard pixel-art edges).
// 2. Within each grid cell, opaque islands smaller than MIN_ISLAND pixels that are
//    not part of the character or its props are removed.
// Colours of kept pixels are never changed. Running it twice changes nothing.
// Usage: node scripts/clean-sprites.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { decodePng } from './sprite-align.mjs';

export const SPRITE_SHEETS = [
  { file: new URL('../public/assets/momo-kitten-64-v3.png', import.meta.url), grid: 8 },
  { file: new URL('../public/assets/momo-adult-64-v3.png', import.meta.url), grid: 8 },
  { file: new URL('../public/assets/didi-walk-v1.png', import.meta.url), grid: 4 },
];
export const ALPHA_CUT = 128;
export const MIN_ISLAND = 20;

export function cleanPixels({ width, height, pixels }, grid) {
  const out = Uint8Array.from(pixels);
  for (let i = 3; i < out.length; i += 4) out[i] = out[i] >= ALPHA_CUT ? 255 : 0;
  for (let i = 0; i < out.length; i += 4) if (!out[i + 3]) out[i] = out[i + 1] = out[i + 2] = 0;
  // Remove small islands, cell by cell, so neighbouring poses never join up.
  const cell = width / grid;
  const seen = new Uint8Array(width * height);
  for (let cy = 0; cy < grid; cy++) for (let cx = 0; cx < grid; cx++) {
    const x0 = Math.round(cx * cell), x1 = Math.round((cx + 1) * cell);
    const y0 = Math.round(cy * cell), y1 = Math.round((cy + 1) * cell);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const start = y * width + x;
      if (seen[start] || !out[start * 4 + 3]) continue;
      const island = [start];
      seen[start] = 1;
      for (let k = 0; k < island.length; k++) {
        const p = island[k], px = p % width, py = (p - px) / width;
        for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1], [px - 1, py - 1], [px + 1, py - 1], [px - 1, py + 1], [px + 1, py + 1]]) {
          if (nx < x0 || nx >= x1 || ny < y0 || ny >= y1) continue;
          const q = ny * width + nx;
          if (!seen[q] && out[q * 4 + 3]) { seen[q] = 1; island.push(q); }
        }
      }
      if (island.length < MIN_ISLAND) for (const p of island) out.fill(0, p * 4, p * 4 + 4);
    }
  }
  return { width, height, pixels: out };
}

// Minimal RGBA PNG encoder; picks the smallest of the None/Sub/Up filters per row.
export function encodePng({ width, height, pixels }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  const candidate = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    let best = 0, bestCost = Infinity;
    for (const filter of [0, 1, 2]) {
      let cost = 0;
      for (let x = 0; x < stride; x++) {
        const v = filter === 0 ? row[x] : filter === 1 ? row[x] - (x >= 4 ? row[x - 4] : 0) : row[x] - (prev ? prev[x] : 0);
        const b = v & 255;
        cost += b < 128 ? b : 256 - b;
      }
      if (cost < bestCost) { bestCost = cost; best = filter; }
    }
    raw[y * (stride + 1)] = best;
    for (let x = 0; x < stride; x++) {
      candidate[x] = best === 0 ? row[x] : best === 1 ? row[x] - (x >= 4 ? row[x - 4] : 0) : row[x] - (prev ? prev[x] : 0);
    }
    candidate.copy(raw, y * (stride + 1) + 1);
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA, no interlace
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  for (const { file, grid } of SPRITE_SHEETS) {
    const image = decodePng(readFileSync(file));
    const cleaned = cleanPixels(image, grid);
    let changed = 0;
    for (let i = 3; i < image.pixels.length; i += 4) if (image.pixels[i] !== cleaned.pixels[i]) changed++;
    console.log(`${fileURLToPath(file).split('/').pop()}: ${changed} pixels changed`);
    if (!check && changed) writeFileSync(file, encodePng(cleaned));
  }
}
