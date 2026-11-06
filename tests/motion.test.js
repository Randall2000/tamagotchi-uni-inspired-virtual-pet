import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FRAME_COUNT,atlasFor,sequences,timelineFor,framePosition,frameRegistration} from '../motion.js';

test('both ages have a complete independent 64-frame transparent PNG atlas',()=>{
  assert.equal(FRAME_COUNT,64);
  assert.notEqual(atlasFor('kitten').src,atlasFor('adult').src);
  for(const stage of ['kitten','growing','adult']) {
    const atlas=atlasFor(stage);
    assert.equal(atlas.columns,8);assert.equal(atlas.rows,8);
    const bytes=readFileSync(new URL('..'+atlas.src,import.meta.url));
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    const dimension=stage==='adult'?1254:1024;assert.equal(bytes.readUInt32BE(16),dimension);assert.equal(bytes.readUInt32BE(20),dimension);
    assert.equal(bytes[25],6,'PNG stores RGBA channels');
    for(let frame=0;frame<64;frame++) {
      const position=framePosition(frame,stage),offset=frameRegistration(frame,stage);
      assert.ok(position.x>=0&&position.x<=100&&position.y>=0&&position.y<=100);
      assert.ok(Math.abs(offset.x)<20&&Math.abs(offset.y)<2);
    }
  }
});
test('every main action has eight distinct poses and takes four to six seconds',()=>{
  const rows={feed:1,clean:2,play:3,rest:4,pet:5,groom:2,stretch:6,window:7};
  for(const [action,row] of Object.entries(rows)) {
    for(const stage of ['kitten','adult']) {
      const frames=timelineFor(action,stage);
      assert.equal(new Set(frames.map(f=>f.frame)).size,8,action);
      assert.ok(frames.every(f=>Math.floor(f.frame/8)===row));
      const duration=frames.reduce((n,f)=>n+f.ms,0);
      assert.ok(duration>=4000&&duration<=6000,action);
    }
  }
  assert.equal(timelineFor('rest').at(-1).frame,39);
  assert.equal(timelineFor('wake').at(-1).frame,0);
  assert.equal(timelineFor('snack'),timelineFor('feed'));
  assert.equal(timelineFor('invalid'),null);
});
test('frame coordinates and all recovery/idle loops remain inside the atlas',()=>{
  assert.deepEqual(framePosition(0),{column:0,row:0,x:0,y:0});
  assert.deepEqual(framePosition(63),{column:7,row:7,x:100,y:100});
  for(const frames of Object.values(sequences))for(const {frame,ms,caption,phase} of frames){assert.doesNotThrow(()=>framePosition(frame));assert.ok(ms>=100);assert.ok(caption&&phase);}
  for(const invalid of [-1,64,2.1,NaN])assert.throws(()=>framePosition(invalid),RangeError);
});
test('character scale depends only on growth and action code cannot move its container',()=>{
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const petBlock=css.match(/\.pet-visual\s*\{([^}]+)\}/)?.[1]||'';
  assert.match(petBlock,/left:\s*42px/);assert.match(petBlock,/bottom:\s*0/);
  assert.doesNotMatch(petBlock,/animation:|transform:|transition:/);
  assert.doesNotMatch(app,/atlas\.style\.(transform|left|top)/);
  assert.doesNotMatch(css,/#room-scene[^{}]*data-action[^{}]*#pet-atlas/);
  assert.match(css,/#room-scene\[data-growth="kitten"\] #pet-atlas\s*\{\s*transform:\s*scale\(\.69\)/);
  assert.match(css,/#room-scene\[data-growth="growing"\] #pet-atlas\s*\{\s*transform:\s*scale\(\.69\)/);
  assert.match(css,/#room-scene\[data-growth="adult"\] #pet-atlas\s*\{\s*transform:\s*scale\(\.88\)/);
  // Size may animate only while a growth event is running.
  for (const rule of css.match(/[^{}]*\{[^{}]*transition:\s*transform[^{}]*\}/g) || []) assert.match(rule, /\.is-growing-up/);
});

test('idle moments pick tail, lick, look or stretch every 3.5–6.5 seconds without leaving the atlas', async () => {
  const { idleBehaviors, pickIdle, IDLE_DELAY_MS } = await import('../motion.js');
  assert.deepEqual(idleBehaviors.map(b => b.id), ['tail', 'lick', 'look', 'stretch']);
  assert.deepEqual({ ...IDLE_DELAY_MS }, { min: 3500, max: 6500 });
  assert.equal(pickIdle(() => 0).behavior.id, 'tail');
  assert.equal(pickIdle(() => 0).delay, 3500);
  assert.equal(pickIdle(() => 0.9999).behavior.id, 'stretch');
  assert.equal(pickIdle(() => 0.9999).delay, 6500);
  const counts = {};
  for (let i = 0; i < 1100; i++) counts[pickIdle(() => (i % 11) / 11 + 0.0001).behavior.id] = (counts[pickIdle(() => (i % 11) / 11 + 0.0001).behavior.id] || 0) + 1;
  assert.ok(counts.tail && counts.lick && counts.look && counts.stretch, JSON.stringify(counts));
  for (const previous of idleBehaviors) {
    for (const choice of [0, 0.2, 0.5, 0.9, 0.9999]) {
      assert.notEqual(pickIdle(() => choice, previous.id).behavior.id, previous.id);
    }
  }
  for (const behavior of idleBehaviors) {
    assert.ok(behavior.frames.length >= 7, behavior.id);
    for (const step of behavior.frames) assert.doesNotThrow(() => framePosition(step.frame), behavior.id);
  }
});
