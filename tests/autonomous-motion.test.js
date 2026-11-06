import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { motionAsset, motionTimeline } from '../motion-pack.js';
import { pickIdle, IDLE_DELAY_MS, idleBehaviors } from '../motion.js';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('idle playback cycles through the full age-specific 24-frame atlas at 12 FPS', () => {
  for (const age of ['kitten', 'adult']) {
    const asset = motionAsset('idle', age);
    assert.equal(asset.frames, 24);
    assert.equal(asset.fps, 12);
    assert.equal(motionTimeline('idle', age).length, 24);
  }
  assert.match(app, /function playIdleFrames\(\)/);
  assert.match(app, /frame = \(frame \+ 1\) % atlas\.frames/);
  assert.match(app, /setTimeout\(nextFrame, 1000 \/ atlas\.fps\)/);
  assert.match(app, /stopIdleFrames\(\)/);
});

test('autonomous actions rotate without repetition on a 3.5–6.5 sec cadence', () => {
  assert.deepEqual({...IDLE_DELAY_MS}, {min: 3500, max: 6500});
  for (const previous of idleBehaviors) {
    for (let i=0; i<10; i++) {
      const chosen=pickIdle(() => i/10, previous.id);
      assert.notEqual(chosen.behavior.id, previous.id);
      assert.ok(chosen.delay>=3500&&chosen.delay<=6500);
    }
  }
  for (const name of ['tail_wag','groom','curious','yawn']) {
    assert.ok(motionAsset(name, 'kitten'), name);
    assert.ok(motionAsset(name, 'adult'), name);
  }
  assert.match(app, /playIdleFrames\(\);\s*scheduleIdle\(\)/);
  assert.match(app, /if \(!document.hidden && !sleeping && !busy && nav.screen === 'room'\)/);
});

test('animations are visual-only; touch remains disabled and body movement is reserved for walking', () => {
  const html=readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css=readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /pointer-events:none/);
  assert.equal((html.match(/data-control="/g)||[]).length,3);
  assert.doesNotMatch(app,/atlas\.style\.transform/);
  assert.match(app,/function walkAround\(\)/);
  assert.match(app,/\$\('pet-visual'\)\.style\.translate = \x60\$\{roomX\}px 0px\x60/);
});
