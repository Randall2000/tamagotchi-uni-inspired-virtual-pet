import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WALK_ATLAS, WALK_LIMIT, planWalk, walkSample, walkFramePosition } from '../roaming.js';
import { decodePng } from '../scripts/sprite-align.mjs';

test('idle routes remain inside the room and reverse before reaching either wall', () => {
  for (let from = -32; from <= 32; from++) {
    for (const random of [0, .25, .5, .99999]) {
      const plan = planWalk(from, () => random);
      assert.ok(plan.duration > 0 && plan.duration < 5500);
      if (from >= 12) assert.equal(plan.direction, -1);
      if (from <= -12) assert.equal(plan.direction, 1);
      let previous = from;
      for (let ms = 0; ms < plan.duration + 100; ms += 16) {
        const sample = walkSample(plan, ms);
        assert.ok(Math.abs(sample.x) <= WALK_LIMIT);
        assert.ok(Math.abs(sample.x - previous) <= 1, 'no teleport between render ticks');
        assert.ok(sample.frame >= 0 && sample.frame < 8);
        previous = sample.x;
      }
      assert.deepEqual(walkSample(plan, plan.duration).x, plan.to);
      assert.equal(walkSample(plan, plan.duration * 2).x, plan.to);
      assert.equal(walkSample(plan, plan.duration * 2).done, true);
    }
  }
});

test('kitten and adult have eight distinct transparent walking frames in separate rows', () => {
  const { pixels, width, height } = decodePng(readFileSync(new URL('..' + WALK_ATLAS, import.meta.url)));
  assert.equal(width, 1254); assert.equal(height, 1254);
  for (const stage of ['kitten', 'adult']) {
    const hashes = new Set();
    for (let frame = 0; frame < 8; frame++) {
      const pos = walkFramePosition(frame, stage);
      assert.ok(stage === 'kitten' ? pos.y < 50 : pos.y > 50);
      const index = frame + (stage === 'kitten' ? 0 : 8);
      const x0 = Math.round(index % 4 * width / 4), x1 = Math.round((index % 4 + 1) * width / 4);
      const y0 = Math.round(Math.floor(index / 4) * height / 4), y1 = Math.round((Math.floor(index / 4) + 1) * height / 4);
      const hash = createHash('sha256'); let clear = 0, opaque = 0;
      for (let y = y0; y < y1; y++) {
        hash.update(pixels.subarray((y * width + x0) * 4, (y * width + x1) * 4));
        for (let x = x0; x < x1; x++) { const a = pixels[(y * width + x) * 4 + 3]; if (a === 0) clear++; if (a > 240) opaque++; }
      }
      assert.ok(clear > 10000 && opaque > 10000, 'drawn cat with transparent surroundings');
      hashes.add(hash.digest('hex'));
    }
    assert.equal(hashes.size, 8);
  }
  assert.deepEqual(walkFramePosition(5, 'growing'), walkFramePosition(5, 'adult'));
});
