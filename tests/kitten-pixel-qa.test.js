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
  return palette;
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
test('adult master and all 19 motions use the approved low-color hard pixel grid',()=>{
  const shared=new Set(colorsAndPixels(load('/public/assets/momo-adult-64-v4.png'),'adult master'));
  for(const name of MOTION_ACTIONS) {
    const a=motionAsset(name,'adult');
    const im=load(a.src);
    assert.deepEqual([im.width,im.height],[1024,a.rows*128]);
    for(const color of colorsAndPixels(im,'adult '+name)) shared.add(color);
  }
  assert.ok(shared.size<=32,'adult motions do not share one palette: '+shared.size);
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

test('all 40 open-eye poses retain the original kitten iris RGB within 2 RGB points per channel',()=>{
  // Original user-approved momo-kitten.png sampled at 64 logical pixels.
  // Green/yellow iris median is (219,247,73), independent of the remaster.
  const sourceRgb=[219,247,73];
  const openFrames=[0,1,5,6,7,8,9,10,14,15,16,17,22,23,24,25,26,27,28,29,30,31,
    40,41,42,45,46,47,48,49,50,54,55,56,57,58,59,60,61,63];
  for(const frame of openFrames) {
    const col=frame%8,row=Math.floor(frame/8),found=[[],[],[]];
    for(let y=46;y<68;y+=2) for(let x=44;x<98;x+=2) {
      const off=((row*128+y)*base.width+col*128+x)*4;
      const [r,g,b,a]=base.pixels.subarray(off,off+4);
      if(a===255&&g>135&&g>=r-10&&g>b*1.35&&b<195) {
        found[0].push(r);found[1].push(g);found[2].push(b);
      }
    }
    assert.ok(found[0].length>=50,'missing green iris in open frame '+frame);
    for(let k=0;k<3;k++){
      found[k].sort((a,b)=>a-b);
      const median=found[k][Math.floor(found[k].length/2)];
      assert.ok(Math.abs(median-sourceRgb[k])<=2,
        'original iris color changed in frame '+frame+', RGB channel '+k+
        ': expected '+sourceRgb[k]+' got '+median);
    }
  }
});

test('64-frame master and every kitten motion atlas have zero brown/teal/purple eye pixels',()=>{
  const forbidden=new Set([
    '118,68,38','165,101,44','210,152,63',
    '75,140,166','153,208,227',
    '133,42,75','195,63,99','239,119,161',
  ]);
  const images=[['master',base]];
  for(const action of MOTION_ACTIONS)
    images.push([action,load(motionAsset(action,'kitten').src)]);
  let total=0;
  for(const [name,im] of images) {
    const frames=(im.width/128)*(im.height/128);
    for(let f=0;f<frames;f++) {
      const col=f%8,row=Math.floor(f/8);
      for(const [x0,y0,x1,y1] of [[22,23,35,34],[36,23,49,34]])
        for(let y=y0*2;y<y1*2;y+=2)for(let x=x0*2;x<x1*2;x+=2) {
          const i=((row*128+y)*im.width+col*128+x)*4;
          const key=im.pixels[i]+','+im.pixels[i+1]+','+im.pixels[i+2];
          assert.ok(!forbidden.has(key),
            'eye material changed color in '+name+' frame '+f+' pixel '+x+','+y+' RGB '+key);
        }
      total++;
    }
  }
  assert.ok(total>=480,'expected full action coverage');
});
