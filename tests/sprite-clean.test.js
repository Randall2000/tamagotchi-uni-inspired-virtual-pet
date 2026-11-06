import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../scripts/sprite-align.mjs';
import { SPRITE_SHEETS, cleanPixels } from '../scripts/clean-sprites.mjs';
import { atlasFor } from '../motion.js';
import { WALK_ATLAS } from '../roaming.js';

test('every atlas the game draws is covered by the cleanup', () => {
  const cleaned = SPRITE_SHEETS.map(({ file }) => '/public/assets/' + fileURLToPath(file).split('/').pop());
  for (const src of [atlasFor('kitten').src, atlasFor('adult').src, WALK_ATLAS]) assert.ok(cleaned.includes(src), src);
});

for (const { file, grid } of SPRITE_SHEETS) {
  const name = fileURLToPath(file).split('/').pop();
  test(`${name}: background fully removed — alpha is only 0 or 255, no faint haze, halos or stray specks`, () => {
    const image = decodePng(readFileSync(file));
    let partial = 0;
    for (let i = 3; i < image.pixels.length; i += 4) if (image.pixels[i] !== 0 && image.pixels[i] !== 255) partial++;
    assert.equal(partial, 0, `${partial} semi-transparent pixels`);
    const again = cleanPixels(image, grid);
    assert.ok(Buffer.from(again.pixels).equals(Buffer.from(image.pixels)), 'stray specks or haze remain (run node scripts/clean-sprites.mjs)');
  });
}
