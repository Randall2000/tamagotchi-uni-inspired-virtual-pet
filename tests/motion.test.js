import test from 'node:test';
import assert from 'node:assert/strict';
import { sequences, timelineFor } from '../motion.js';

test('care actions have readable anticipation, execution, and reward phases', () => {
  for (const name of ['feed', 'play', 'clean', 'pet']) {
    const timeline = timelineFor(name);
    assert.ok(timeline.length >= 3, name);
    assert.equal(timeline[0].phase, 'notice', name);
    assert.equal(timeline.at(-1).phase, 'reward', name);
    assert.ok(timeline.some(frame => !['notice', 'reward'].includes(frame.phase)), name);
  }
});

test('animation frames are finite and effects/captions are defined', () => {
  for (const [action, frames] of Object.entries(sequences)) {
    let total = 0;
    for (const frame of frames) {
      assert.ok(frame.ms >= 100 && frame.ms <= 1500, action);
      assert.ok(frame.pose.length > 0 && frame.caption.length > 0, action);
      assert.ok(frame.phase.length > 0, action);
      total += frame.ms;
    }
    assert.ok(total >= 500 && total < 10000, action);
  }
  assert.equal(timelineFor('invalid'), null);
});

test('rest transitions into sleep and wake transitions out', () => {
  assert.equal(timelineFor('rest').at(-1).pose, 'sleep');
  assert.equal(timelineFor('wake').at(-1).pose, 'idle');
});
