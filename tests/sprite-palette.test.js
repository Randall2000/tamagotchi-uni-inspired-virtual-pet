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
test('grown cat follows the selected kitten palette without warm brown fur or dull gold eyes',()=>{
  const kitten=palette('kitten'),adult=palette('adult');
  for(const material of Object.keys(bands)) {
    const tolerance=material==='eyes'?24:10;
    for(let c=0;c<3;c++) assert.ok(Math.abs(adult[material][c]-kitten[material][c])<=tolerance,`${material}: ${adult[material]} vs ${kitten[material]}`);
  }
  assert.ok(adult.fur[2]>adult.fur[1],'fur retains cool charcoal undertone');
  assert.ok(adult.eyes[1]>adult.eyes[0],'eyes remain yellow-green rather than gold');
  assert.ok(Math.min(...adult.white)>=235,'white markings remain bright');
});
