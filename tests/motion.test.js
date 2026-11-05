import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { FRAME_COUNT, SPRITE_ATLAS, sequences, timelineFor, framePosition } from '../motion.js';

test('every action uses real frame indices inside a 4x4 atlas', () => {
  assert.equal(FRAME_COUNT, 16);
  assert.equal(SPRITE_ATLAS, '/public/assets/momo-16frames.webp');
  for (const [name, sequence] of Object.entries(sequences)) {
    assert.ok(sequence.length >= 3, name);
    let totalMs = 0;
    for (const entry of sequence) {
      assert.ok(Number.isInteger(entry.frame), name);
      assert.ok(entry.frame >= 0 && entry.frame < FRAME_COUNT, name);
      assert.ok(entry.ms >= 100 && entry.ms < 1000, name);
      assert.ok(entry.caption.length > 0 && entry.phase.length > 0, name);
      totalMs += entry.ms;
    }
    assert.ok(totalMs >= 400 && totalMs < 7000, name);
  }
  assert.equal(timelineFor('invalid'), null);
});

test('each row maps to the supplied sprite sheet activity', () => {
  assert.deepEqual(timelineFor('blink').map(({frame}) => frame), [1,2,3,0]);
  assert.deepEqual([...new Set(timelineFor('feed').map(({frame}) => Math.floor(frame / 4)))], [1]);
  assert.deepEqual([...new Set(timelineFor('clean').map(({frame}) => Math.floor(frame / 4)))], [2]);
  assert.deepEqual([...new Set(timelineFor('play').map(({frame}) => Math.floor(frame / 4)))], [3]);
  assert.equal(timelineFor('rest').at(-1).frame, 2);
  assert.equal(timelineFor('wake').at(-1).frame, 0);
});

test('frame coordinates are stable, bounded, and deterministic', () => {
  assert.deepEqual(framePosition(0), { column: 0, row: 0, x: 0, y: 0 });
  assert.deepEqual(framePosition(15), { column: 3, row: 3, x: 100, y: 100 });
  assert.equal(framePosition(6).column, 2);
  assert.equal(framePosition(6).row, 1);
  for (const invalid of [-1, 16, 99, 2.1, NaN]) {
    assert.throws(() => framePosition(invalid), RangeError);
  }
});

test('CSS keeps pet fixed and uses background-position only for frame changes', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const petBlock = css.match(/\.pet-visual\s*\{([^}]+)\}/)?.[1] || '';
  assert.match(petBlock, /left:\s*42px/);
  assert.match(petBlock, /bottom:\s*0/);
  assert.doesNotMatch(petBlock, /animation:|transform:|transition:/);
  assert.doesNotMatch(css, /@keyframes\s+pet-|\.pet-visual\s*\{\s*animation:/);
  assert.match(app, /backgroundPosition\s*=\s*x\s*\+\s*'% '/);
  assert.doesNotMatch(app, /style\.transform|style\.left|style\.top/);
});

test('the source atlas is a real WebP bitmap, not an empty or missing placeholder', () => {
  const url = new URL('../public/assets/momo-16frames.webp', import.meta.url);
  assert.ok(statSync(url).size > 3000);
  const bytes = readFileSync(url);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
});
