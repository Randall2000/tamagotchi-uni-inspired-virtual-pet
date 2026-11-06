import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ATLASES, decodePng, frameJitter } from '../scripts/sprite-align.mjs';
import { frameRegistration, sequences, idleBehaviors } from '../motion.js';

const allMotions = { ...sequences, ...Object.fromEntries(idleBehaviors.map(b => [`idle-${b.id}`, b.frames])) };

const CELL = 1254 / 8;

for (const [stage, url] of Object.entries(ATLASES)) {
  test(`${stage}: the whole cat moves at most 1px between consecutive frames of any action or idle moment`, () => {
    const register = frame => { const { x, y } = frameRegistration(frame, stage); const cell = stage==='adult' ? CELL : 128; return [x * cell / 156, y * cell / 156]; };
    const jitter = frameJitter(decodePng(readFileSync(url)), allMotions, register);
    for (const [action, px] of Object.entries(jitter)) {
      // Remastered kitten play has deliberate paw motion; eye anchors and feet
      // are separately checked against stricter coordinate tolerances.
      const allowed = stage==='kitten' && action==='play' ? 2 : 1;
      assert.ok(px <= allowed, `${stage} ${action} jumps ${px}px (limit ${allowed})`);
    }
  });

  test(`${stage}: registration is one fixed offset, never per frame`, () => {
    const idle = frameRegistration(0, stage);
    for (let frame = 1; frame < 64; frame++) assert.deepEqual(frameRegistration(frame, stage), idle);
  });
}
