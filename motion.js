// 8 action rows x 8 original poses, with drawn tail variations in both age atlases.
export const FRAME_COUNT = 64;
export const SPRITE_ATLAS = '/public/assets/momo-adult-64-v3.png';
export const KITTEN_ATLAS = '/public/assets/momo-kitten-64-v2.png';
export function atlasFor(stage = 'adult') {
  return { src: stage === 'adult' ? SPRITE_ATLAS : KITTEN_ATLAS, columns: 8, rows: 8, frames: FRAME_COUNT };
}
const captions = {
  blink: ['陪著你','搖搖尾巴','眨眨眼','閉上眼睛','張開眼睛','動動耳朵','看看你','陪著你'],
  feed: ['聞到香味','看看碗裡','張嘴吃一口','慢慢咀嚼','再嚼一下','吃得開心','舔舔嘴巴','吃完了'],
  clean: ['準備洗臉','抬起小爪','舔舔爪子','再舔一下','擦擦臉頰','擦擦額頭','放下爪子','乾淨了'],
  play: ['發現毛線球','觀察一下','伸出小爪','碰到毛線球','推推毛線球','再拍拍一下','收回爪子','玩得開心'],
  rest: ['有點想睡','打個呵欠','收起呵欠','眼皮變重','閉上眼睛','放鬆下來','安靜休息','睡著了'],
  pet: ['看著你','放鬆耳朵','喜歡摸摸','瞇起眼睛','好舒服','張開眼睛','開心陪伴','陪著你'],
  stretch: ['準備伸展','抬起小爪','伸出雙爪','慢慢伸展','再伸一下','收回雙爪','放下小爪','舒服了'],
  window: ['看看窗外','望向左邊','聽聽聲音','轉回目光','望向右邊','好奇看看','眨眨眼睛','回頭看你'],
};
const phases = ['anticipation','anticipation','action','action','action','reaction','recover','idle'];
const row = (name, start, ms, order = [0,1,2,3,4,5,6,7]) => order.map(i => ({ frame:start+i, caption:captions[name][i], phase:phases[i], ms }));
export const sequences = Object.freeze({
  blink: row('blink',0,220),
  feed: row('feed',8,450,[0,1,2,3,4,3,4,5,6,7]),
  clean: row('clean',16,460,[0,1,2,3,4,5,3,4,6,7]),
  play: row('play',24,460,[0,1,2,3,4,5,3,4,6,7]),
  rest: row('rest',32,650),
  wake: [39,38,37,36,35,34,33,32,0].map(frame=>({frame,caption:'慢慢醒來',phase:'recover',ms:380})),
  sleep: [37,38,39,38,37,38,39,39].map(frame=>({frame,caption:'安靜熟睡',phase:'sleep',ms:500})),
  pet: row('pet',40,500),
  groom: row('clean',16,460,[0,1,2,3,4,5,3,4,6,7]),
  stretch: row('stretch',48,550),
  window: row('window',56,550),
});
export const kittenSequences = sequences;

// Short idle moments reuse drawn frames; they never change stats and any key interrupts them.
const idleRow = (name, start, order, ms, caption) => order.map(i => ({ frame: start + i, caption, phase: 'idle', ms }));
export const idleBehaviors = Object.freeze([
  { id: 'tail', weight: 4, frames: sequences.blink },
  { id: 'lick', weight: 3, frames: idleRow('clean', 16, [1, 2, 3, 2, 3, 6, 7], 320, '舔舔爪子') },
  { id: 'look', weight: 3, frames: idleRow('window', 56, [0, 1, 1, 3, 4, 4, 6, 7], 380, '東張西望') },
  { id: 'stretch', weight: 1, frames: idleRow('stretch', 48, [0, 1, 2, 3, 4, 5, 6, 7], 420, '伸個懶腰') },
]);
export const IDLE_DELAY_MS = Object.freeze({ min: 3500, max: 6500 });

// Picks an idle behavior and the wait before the next one from a random value in [0, 1).
export function pickIdle(random = Math.random, previousId = null) {
  // Avoid two successive identical moments; keep weighted variation and don't
  // change the virtual pet's stats during these autonomous animations.
  const choices = idleBehaviors.filter(b => b.id !== previousId);
  const available = choices.length ? choices : idleBehaviors;
  const total = available.reduce((sum, b) => sum + b.weight, 0);
  let roll = random() * total;
  const behavior = available.find(b => (roll -= b.weight) < 0) || available[0];
  const delay = IDLE_DELAY_MS.min + Math.floor(random() * (IDLE_DELAY_MS.max - IDLE_DELAY_MS.min + 1));
  return { behavior, delay };
}
export function timelineFor(action, stage = 'adult') {
  return sequences[action === 'snack' ? 'feed' : action] || null;
}
export function framePosition(frame, stage = 'adult') {
  if (!Number.isInteger(frame) || frame < 0 || frame >= FRAME_COUNT) throw new RangeError('Invalid sprite frame: ' + frame);
  return { column:frame%8,row:Math.floor(frame/8),x:(frame%8)*100/7,y:Math.floor(frame/8)*100/7 };
}
// One fixed registration point per atlas (the idle pose). The atlases are drawn with planted
// feet, so every frame uses the same offset; per-frame corrections made the whole cat jitter.
// scripts/sprite-align.mjs measures frame-to-frame movement (tests keep it at or under 1px).
const IDLE_ANCHOR = { kitten: [86.0, 147.0], adult: [94.0, 147.0] };
export function frameRegistration(frame, stage = 'adult') {
  framePosition(frame, stage);
  const [anchorX, anchorY] = IDLE_ANCHOR[stage === 'adult' ? 'adult' : 'kitten'];
  const cell = 1254 / 8;
  return { x: (cell / 2 - anchorX) * 156 / cell, y: (147 - anchorY) * 156 / cell };
}
