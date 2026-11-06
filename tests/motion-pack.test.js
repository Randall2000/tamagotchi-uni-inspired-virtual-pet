import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { MOTION_ACTIONS, MOTION_LIBRARY, motionAsset, motionFramePosition, motionTimeline } from '../motion-pack.js';

test('19 distinct stage-specific action atlases exist for both kitten and adult', () => {
  assert.equal(MOTION_ACTIONS.length,19);
  for(const stage of ['kitten','adult']) for (const action of MOTION_ACTIONS) {
    const asset=motionAsset(action,stage);
    assert.ok(asset.src.includes('/'+stage+'/'),action);
    const path=new URL('..'+asset.src,import.meta.url);
    assert.ok(existsSync(path),asset.src);
    const bytes=readFileSync(path);
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a',asset.src);
    assert.equal(bytes.readUInt32BE(16),asset.columns*asset.cellPx,asset.src);
    assert.equal(bytes.readUInt32BE(20),asset.rows*asset.cellPx,asset.src);
    assert.equal(bytes[25],6,'RGBA PNG '+asset.src);
    assert.equal(motionTimeline(action,stage).length,asset.frames);
    for(let i=0;i<asset.frames;i++){
      const p=motionFramePosition(i,asset);
      assert.ok(p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100);
    }
    assert.ok(statSync(path).size>500,asset.src);
  }
});

test('aliases map established care actions to their appropriate motion',()=>{
  const aliases={
    feed:'eat', snack:'snack', clean:'groom', groom:'groom', play:'play',
    pet:'petting', rest:'sleep_prep', wake:'wake', window:'curious',
    drink:'drink', toilet:'toilet', sleep:'sleep',
  };
  for(const [name,action] of Object.entries(aliases))
    assert.equal(motionAsset(name,'adult').action,action,name);
  assert.equal(motionAsset('stretch'),null,'legacy stretch keeps original source until approved artwork');
  assert.equal(motionTimeline('unknown'),null);
});

test('every preview frame uses the specified fps and has a semantic caption',()=>{
  for(const action of MOTION_ACTIONS){
    const asset=motionAsset(action);
    assert.ok([8,12].includes(asset.fps));
    assert.ok([16,24,32].includes(asset.frames));
    const frames=motionTimeline(action);
    assert.ok(frames.every(f=>f.ms===1000/asset.fps&&f.caption&&f.assetAction===action));
    assert.throws(()=>motionFramePosition(asset.frames,asset),RangeError);
  }
});

test('previews are clearly identified as not hand-certified production artwork',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/assets/momo-motions-preview/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.length,38);
  assert.ok(manifest.every(e=>e.quality.startsWith('preview')));
});
