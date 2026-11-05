// Measures how far the whole cat visibly moves between consecutive animation frames.
// Each frame's silhouette (excluding red/pink props) is matched to the previous frame by
// translation, then the registration offsets applied by motion.js are added on top.
// Usage: node scripts/sprite-align.mjs  → prints the worst frame-to-frame jump per action.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const ATLASES = {
  kitten: new URL('../public/assets/momo-kitten-64-v2.png', import.meta.url),
  adult: new URL('../public/assets/momo-adult-64-v2.png', import.meta.url),
};
export const GRID = 8;

// Minimal decoder for 8-bit RGBA, non-interlaced PNGs (the atlas format).
export function decodePng(buffer) {
  let offset = 8;
  let width = 0, height = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('Expected 8-bit RGBA non-interlaced PNG');
    }
    if (type === 'IDAT') idat.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = x >= 4 && y ? pixels[(y - 1) * stride + x - 4] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      pixels[y * stride + x] = value & 255;
    }
  }
  return { width, height, pixels };
}

// Silhouette mask of one cell: opaque, non-prop pixels.
export function bodyMask(image, frame) {
  const cell = image.width / GRID;
  const x0 = Math.ceil((frame % GRID) * cell), y0 = Math.ceil(Math.floor(frame / GRID) * cell);
  const size = Math.floor(cell) - 1;
  const opaque = [];
  let top = Infinity, bottom = -1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = ((y0 + y) * image.width + x0 + x) * 4;
    const [r, g, , a] = image.pixels.subarray(i, i + 4);
    if (a < 128 || (r > 150 && g < 120)) continue; // transparent, or red bowl / pink yarn
    opaque.push([x, y]);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const mask = new Uint8Array(size * size);
  for (const [x, y] of opaque) mask[y * size + x] = 1;
  return { mask, size };
}

// Translation (dx, dy) that best overlays `moving` onto `fixed`.
export function bestShift(fixed, moving, radius = 14, radiusY = 4) {
  const { size } = fixed;
  let best = { dx: 0, dy: 0, score: -1 };
  for (let dy = -radiusY; dy <= radiusY; dy++) for (let dx = -radius; dx <= radius; dx++) {
    let score = 0;
    for (let y = Math.max(0, -dy); y < Math.min(size, size - dy); y++) {
      const row = y * size, shifted = (y + dy) * size;
      for (let x = Math.max(0, -dx); x < Math.min(size, size - dx); x++) {
        if (moving.mask[row + x] && fixed.mask[shifted + x + dx]) score++;
      }
    }
    if (score > best.score || (score === best.score && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy))) best = { dx, dy, score };
  }
  return best;
}

// Largest visible jump (source px) between consecutive frames of each action.
// `register(frame)` returns the offset motion.js applies, in source pixels.
export function frameJitter(image, sequences, register) {
  const masks = Array.from({ length: GRID * GRID }, (_, frame) => bodyMask(image, frame));
  const report = {};
  for (const [name, frames] of Object.entries(sequences)) {
    let worst = 0;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].frame, b = frames[i].frame;
      if (a === b) continue;
      const drawn = bestShift(masks[a], masks[b], 6, 4);
      const [ax, ay] = register(a), [bx, by] = register(b);
      worst = Math.max(worst, Math.hypot(bx - ax - drawn.dx, by - ay - drawn.dy));
    }
    report[name] = Math.round(worst * 10) / 10;
  }
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { frameRegistration, sequences } = await import('../motion.js');
  const cell = 1254 / GRID;
  for (const [stage, url] of Object.entries(ATLASES)) {
    const register = frame => { const { x, y } = frameRegistration(frame, stage); return [x * cell / 156, y * cell / 156]; };
    console.log(stage, JSON.stringify(frameJitter(decodePng(readFileSync(url)), sequences, register)));
  }
}
