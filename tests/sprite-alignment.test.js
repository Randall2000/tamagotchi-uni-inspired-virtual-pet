import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ATLASES, decodePng, frameJitter } from '../scripts/sprite-align.mjs';
import { frameRegistration, sequences } from '../motion.js';

const CELL = 1254 / 8;

for (const [stage, url] of Object.entries(ATLASES)) {
  test(`${stage}: the whole cat moves at most 1px between consecutive frames of any action`, () => {
    const register = frame => { const { x, y } = frameRegistration(frame, stage); return [x * CELL / 156, y * CELL / 156]; };
    const jitter = frameJitter(decodePng(readFileSync(url)), sequences, register);
    for (const [action, px] of Object.entries(jitter)) assert.ok(px <= 1, `${stage} ${action} jumps ${px}px`);
  });

  test(`${stage}: registration is one fixed offset, never per frame`, () => {
    const idle = frameRegistration(0, stage);
    for (let frame = 1; frame < 64; frame++) assert.deepEqual(frameRegistration(frame, stage), idle);
  });
}
