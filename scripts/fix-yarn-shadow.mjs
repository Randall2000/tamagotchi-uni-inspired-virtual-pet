// One-off repaint for the adult "play with yarn" row (frames 24–31) of momo-adult-64-v3.png.
// The generator painted the reaching foreleg and the floor behind the yarn ball in a muddy
// purple-grey, which reads as a smudge. In the lower-left of each frame, purple-grey pixels to
// the right of the ball's centre (foreleg and body side) are repainted with fur; those to its
// left (floor shadow behind the ball) are made transparent and the new edge gets the sprite's
// dark outline. Usage: node scripts/fix-yarn-shadow.mjs [out.png]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodePng } from './sprite-align.mjs';
import { encodePng, cleanPixels } from './clean-sprites.mjs';

export const ADULT_ATLAS = new URL('../public/assets/momo-adult-64-v3.png', import.meta.url);
export const YARN_FRAMES = [24, 25, 26, 27, 28, 29, 30, 31];
const GRID = 8;
const FUR = [44, 36, 46];
const OUTLINE = [32, 20, 32];

export const isShadowColour = (r, g, b) => r >= 60 && r <= 120 && g >= 36 && g <= 90 && b >= 48 && b <= 105 && r - g >= 12 && b >= g && r >= b - 8;

function cellOrigin(width, frame) {
  const cell = width / GRID;
  return [Math.round((frame % GRID) * cell), Math.round(Math.floor(frame / GRID) * cell), Math.floor(cell)];
}

// All shadow-coloured pixels in the lower-left of the cell, plus the yarn ball's centre.
export function findShadowBlob(image, frame) {
  const { width, pixels } = image;
  const [x0, y0, size] = cellOrigin(width, frame);
  const blob = [];
  let pinkX = 0, pinkY = 0, pink = 0;
  for (let y = Math.floor(size * 0.55); y < size; y++) for (let x = 0; x < Math.floor(size * 0.62); x++) {
    const i = ((y0 + y) * width + x0 + x) * 4;
    const [r, g, b, a] = pixels.subarray(i, i + 4);
    if (!a) continue;
    if (isShadowColour(r, g, b)) blob.push([x, y]);
    else if (r > 150 && g < 140 && b > 90) { pinkX += x; pinkY += y; pink++; }
  }
  blob.ball = pink ? [pinkX / pink, pinkY / pink] : [size * 0.3, size * 0.85];
  return blob;
}

export function repaintYarnRow(image) {
  const { width, pixels } = image;
  const out = { ...image, pixels: Uint8Array.from(pixels) };
  const size = cellOrigin(width, 0)[2];
  for (const frame of YARN_FRAMES) {
    const [x0, y0] = cellOrigin(width, frame);
    const at = (x, y) => ((y0 + y) * width + x0 + x) * 4;
    const blob = findShadowBlob(image, frame);
    const [ballX] = blob.ball;
    const cleared = new Set();
    const isPink = (x, y) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return false;
      const [r, g, b, a] = image.pixels.subarray(at(x, y), at(x, y) + 4);
      return a && r > 150 && g < 140 && b > 90;
    };
    for (const [x, y] of blob) {
      const i = at(x, y);
      if (x >= ballX) out.pixels.set([...FUR, 255], i);
      // Floor shadow touching the yarn becomes the yarn's outline so the thin thread stays whole.
      else if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => isPink(nx, ny))) out.pixels.set([...OUTLINE, 255], i);
      else { out.pixels.fill(0, i, i + 4); cleared.add(y * size + x); }
    }
    // Opaque pixels next to newly cleared ones become the dark outline.
    for (const key of cleared) {
      const x = key % size, y = (key - x) / size;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= size || ny >= size || cleared.has(ny * size + nx)) continue;
        const j = at(nx, ny);
        const [r, g, b, a] = out.pixels.subarray(j, j + 4);
        if (a && !(r < 60 && g < 60 && b < 60)) out.pixels.set([...OUTLINE, 255], j);
      }
    }
  }
  // Close the yarn's outline on its left side: transparent pixels touching pink become outline.
  for (const frame of YARN_FRAMES) {
    const [x0, y0] = cellOrigin(width, frame);
    const ballX = findShadowBlob(image, frame).ball[0];
    const at = (x, y) => ((y0 + y) * width + x0 + x) * 4;
    const ring = [];
    for (let y = Math.floor(size * 0.55); y < size; y++) for (let x = 0; x < ballX; x++) {
      const [r, g, b, a] = out.pixels.subarray(at(x, y), at(x, y) + 4);
      if (!(a && r > 150 && g < 140 && b > 90)) continue;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && !out.pixels[at(nx, ny) + 3]) ring.push(at(nx, ny));
      }
    }
    for (const i of ring) out.pixels.set([...OUTLINE, 255], i);
    // Seal one-pixel gaps left in the outline where the shadow used to meet it.
    const opaque = (x, y) => x >= 0 && y >= 0 && x < size && y < size && out.pixels[at(x, y) + 3] > 0;
    for (let pass = 0; pass < 2; pass++) {
      const gaps = [];
      for (let y = Math.floor(size * 0.55); y < size; y++) for (let x = 0; x < Math.floor(size * 0.62); x++) {
        if (!opaque(x, y) && ((opaque(x - 1, y) && opaque(x + 1, y)) || (opaque(x, y - 1) && opaque(x, y + 1)))) gaps.push(at(x, y));
      }
      for (const i of gaps) out.pixels.set([...OUTLINE, 255], i);
    }
  }
  return cleanPixels(out, GRID);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] || fileURLToPath(ADULT_ATLAS);
  const image = decodePng(readFileSync(ADULT_ATLAS));
  const blobs = YARN_FRAMES.map(frame => findShadowBlob(image, frame).length);
  if (blobs.every(n => n === 0)) {
    console.log('already repainted: no shadow left in the yarn row, nothing written');
  } else {
    YARN_FRAMES.forEach((frame, k) => console.log(`frame ${frame}: blob ${blobs[k]}px`));
    writeFileSync(target, encodePng(repaintYarnRow(image)));
    console.log('written', target);
  }
}
