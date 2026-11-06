import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../scripts/sprite-align.mjs';
import { atlasFor } from '../motion.js';

// Compare opaque material colours, excluding transparent edge halos. These are
// representative medians, not a claim that illustrated highlights are identical.
const bands = {
  fur: (r,g,b) => r>20&&r<90&&g>20&&g<90&&b>20&&b<90,
  white: (r,g,b) => Math.min(r,g,b)>170&&Math.max(r,g,b)-Math.min(r,g,b)<35,
  eyes: (r,g,b) => r>100&&g>r*.95&&g>b*1.5&&b<150,
  pink: (r,g,b) => r>150&&r>g*1.3&&g>75&&b>80&&b>g*.85,
};
function palette(stage) {
  const {pixels}=decodePng(readFileSync(new URL('..'+atlasFor(stage).src,import.meta.url)));
  const result={};
  for(const [name,select] of Object.entries(bands)) {
    const channels=Array.from({length:3},()=>new Uint32Array(256)); let total=0;
    for(let i=0;i<pixels.length;i+=4) {
      const [r,g,b,a]=pixels.subarray(i,i+4);
      if(a<240||!select(r,g,b))continue;
      channels[0][r]++;channels[1][g]++;channels[2][b]++;total++;
    }
    assert.ok(total>100,name+' has sufficient samples');
    result[name]=channels.map(hist=>{let count=0;return hist.findIndex(n=>(count+=n)>=total/2);});
  }
  return result;
}
test('adult and kitten preserve yellow-green eye hue while retaining source-specific brightness',()=>{
  const kitten=palette('kitten'),adult=palette('adult');
  // Kitten's original authorized lime iris is brighter than adult's.
  // Compare stage eye hue, not exact RGB luminance. Eye brightness and
  // eye-region material purity are separately source-locked in Python QA.
  for(const material of Object.keys(bands)) {
    if(material==='eyes')continue;
    for(let c=0;c<3;c++) assert.ok(
      Math.abs(adult[material][c]-kitten[material][c])<=10,
      material+': '+adult[material]+' vs '+kitten[material]);
  }
  const hue=([r,g,b])=>{
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    if(!d)return 0;
    const h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
    return (h*60+360)%360;
  };
  const delta=Math.abs(hue(adult.eyes)-hue(kitten.eyes));
  assert.ok(Math.min(delta,360-delta)<=12,'adult and kitten hue difference exceeds 12 degrees');
  assert.ok(adult.fur[2]>adult.fur[1],'fur retains cool charcoal undertone');
  assert.ok(adult.eyes[1]>adult.eyes[0],'eyes remain yellow-green rather than gold');
  assert.ok(Math.min(...adult.white)>=235,'white markings remain bright');
});
