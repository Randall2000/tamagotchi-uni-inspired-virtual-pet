import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { decodePng } from '../scripts/sprite-align.mjs';
import { atlasFor } from '../motion.js';
import { motionAsset, MOTION_ACTIONS } from '../motion-pack.js';

// Rules from docs/PALETTE.md; scripts/pixel-polish.py makes the sheets satisfy them.
const palette = JSON.parse(readFileSync(new URL('../docs/palette/didi-palette.json', import.meta.url), 'utf8'));
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const COLORS = palette.colors.map(c => c.hex);
const FAMILY = new Map(palette.colors.map(c => [c.hex, c.family]));
const OUTLINE = palette.rules.outline;
const WHITE = '#fbf6f3';
const MID_GREYS = new Set(['#554e5b', '#6e6974', '#a19ea5', '#cac9cb']);
const FEET_ROWS = 6;

function lab([r, g, b]) {
  const lin = v => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R + 0.7152 * G + 0.0722 * B, z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const sheets = [
  ['kitten master', atlasFor('kitten').src],
  ['adult master', atlasFor('adult').src],
  ...MOTION_ACTIONS.flatMap(a => [[`kitten ${a}`, motionAsset(a, 'kitten').src], [`adult ${a}`, motionAsset(a, 'adult').src]]),
];

// Logical grid: one entry per 2x2 block, palette hex or null when transparent.
function logical(src) {
  const { width, height, pixels } = decodePng(readFileSync(new URL('..' + src, import.meta.url)));
  const w = width / 2, h = height / 2, grid = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * 2 * width + x * 2) * 4;
    grid[y * w + x] = pixels[i + 3] ? '#' + [0, 1, 2].map(k => pixels[i + k].toString(16).padStart(2, '0')).join('') : null;
  }
  return { w, h, at: (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : grid[y * w + x]) };
}
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];

test('palette: 24 named colours, every pair at least ΔE 10 apart, outline included', () => {
  assert.equal(COLORS.length, 24);
  assert.ok(COLORS.includes(OUTLINE));
  const L = COLORS.map(h => lab(hexRgb(h)));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const d = Math.hypot(L[i][0] - L[j][0], L[i][1] - L[j][1], L[i][2] - L[j][2]);
    assert.ok(d >= palette.rules.min_delta_e, `${COLORS[i]} vs ${COLORS[j]} only ΔE ${d.toFixed(1)}`);
  }
  for (const c of palette.colors) assert.ok(c.role && c.family, c.hex);
});

test('the master atlases and all 38 motion sheets are checked', () => {
  assert.equal(sheets.length, 40);
  for (const stage of ['kitten', 'adult']) {
    const files = readdirSync(new URL(`../public/assets/momo-motions-preview/${stage}/`, import.meta.url)).filter(f => f.endsWith('.png'));
    assert.equal(files.length, MOTION_ACTIONS.length, stage);
  }
});

for (const [name, src] of sheets) {
  test(`${name}: only palette colours, no speckles, no notches, clean outline, no stray prop colours`, () => {
    const g = logical(src);
    const problems = { offPalette: 0, speckle: 0, notch: 0, edge: 0, strayProp: 0 };
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      const c = g.at(x, y);
      const n4 = N4.map(([dx, dy]) => g.at(x + dx, y + dy));
      const opaque4 = n4.filter(Boolean).length;
      if (!c) {
        if (opaque4 >= 3 && y % 64 < 64 - FEET_ROWS) problems.notch++;
        continue;
      }
      if (!FAMILY.has(c)) { problems.offPalette++; continue; }
      const n8 = N8.map(([dx, dy]) => g.at(x + dx, y + dy)).filter(Boolean);
      const fam = FAMILY.get(c);
      if (opaque4 === 4 && fam !== 'eye' && c !== WHITE && !n8.includes(c) && n8.length >= 5) {
        const counts = new Map(); for (const v of n8) counts.set(v, (counts.get(v) || 0) + 1);
        const [m, votes] = [...counts].sort((a, b) => b[1] - a[1])[0];
        const mf = FAMILY.get(m);
        if (votes >= 5 && mf !== 'eye' && (mf === fam || (MID_GREYS.has(c) && (mf === 'dark' || mf === 'light')))) problems.speckle++;
      }
      if (fam !== 'eye' && opaque4 === 3 && c !== OUTLINE) problems.edge++;
      if (fam === 'prop') {
        const propNb = n8.filter(v => FAMILY.get(v) === 'prop').length;
        const body = n8.filter(v => FAMILY.get(v) !== 'prop' && FAMILY.get(v) !== 'eye').length;
        if (propNb <= 2 && body >= 3) problems.strayProp++;
      }
    }
    assert.deepEqual(problems, { offPalette: 0, speckle: 0, notch: 0, edge: 0, strayProp: 0 });
  });
}
