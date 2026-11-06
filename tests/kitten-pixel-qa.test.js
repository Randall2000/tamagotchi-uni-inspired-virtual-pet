import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodePng} from '../scripts/sprite-align.mjs';
import {atlasFor} from '../motion.js';
import {motionAsset,MOTION_ACTIONS} from '../motion-pack.js';
const load=src=>decodePng(readFileSync(new URL('..'+src,import.meta.url)));
const base=load('/public/assets/momo-kitten-64-v3.png');
function colorsAndPixels(im,label){
  assert.equal(im.width%128,0);assert.equal(im.height%128,0);
  const palette=new Set(),p=im.pixels;
  for(let y=0;y<im.height;y+=2)for(let x=0;x<im.width;x+=2){
    const i=(y*im.width+x)*4,r=p[i],g=p[i+1],b=p[i+2],a=p[i+3];
    assert.ok(a===0||a===255,label+' alpha');
    if(!a)assert.equal(r+g+b,0,label+' halo');
    else palette.add(r+','+g+','+b);
    for(const [dx,dy] of [[1,0],[0,1],[1,1]]){
      const j=((y+dy)*im.width+x+dx)*4;
      for(let k=0;k<4;k++)assert.equal(p[i+k],p[j+k],label+' grid mismatch');
    }
  }
  assert.ok(palette.size<=32,label+' palette='+palette.size);
}
test('kitten 64-frame master is crisp and uses fixed palette',()=>{
  assert.deepEqual([base.width,base.height],[1024,1024]);
  assert.equal(atlasFor('kitten').src,'/public/assets/momo-kitten-64-v3.png');
  colorsAndPixels(base,'master');
});
test('19 kitten daily motion sheets have hard 2x logical pixels',()=>{
  assert.equal(MOTION_ACTIONS.length,19);
  for(const name of MOTION_ACTIONS) {
    const a=motionAsset(name,'kitten'),im=load(a.src);
    assert.deepEqual([im.width,im.height],[1024,a.rows*128]);
    colorsAndPixels(im,name);
  }
});

function eyeBounds(frame){
  const col=frame%8,row=Math.floor(frame/8),pts=[];
  for(let y=44;y<72;y+=2)for(let x=40;x<104;x+=2){
    const i=((row*128+y)*base.width+col*128+x)*4;
    const [r,g,b,a]=base.pixels.subarray(i,i+4);
    if(a&&g>135&&g>=r-10&&g>b*1.35&&b<195)pts.push([x/2,y/2]);
  }
  return pts.length ? [Math.min(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[0])),
    Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[1]))] : null;
}
test('eyes never leave canonical eye sockets in all open poses',()=>{
  const expected=eyeBounds(0);assert.ok(expected);
  const open=[0,1,5,6,7,8,9,10,14,15,16,17,22,23,24,25,26,27,28,29,30,31,
    40,41,42,45,46,47,48,49,50,54,55,56,57,58,59,60,61,63];
  for(const f of open) assert.deepEqual(eyeBounds(f),expected,'eye drift frame '+f);
  for(const f of [3,11,12,13,18,19,20,21,34,35,36,37,38,39,43,44,51,52,53,62])
    assert.equal(eyeBounds(f),null,'closed eye incorrectly green frame '+f);
});
test('feet share ground anchor within one logical pixel; no whole-body bob',()=>{
  const feet=[];
  for(let f=0;f<64;f++){
    let bottom=-1;
    for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){
      const p=((Math.floor(f/8)*128+y)*base.width+(f%8)*128+x)*4;
      if(base.pixels[p+3]===255)bottom=y;
    }
    assert.ok(bottom>=110&&bottom<128,'clip/floating frame '+f);
    feet.push(bottom);
  }
  assert.ok(Math.max(...feet)-Math.min(...feet)<=2);
});
