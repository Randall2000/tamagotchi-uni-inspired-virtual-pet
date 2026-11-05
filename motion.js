// Deterministic sprite frames from the user's 4x4 atlas.
// Row 0: neutral/blink; row 1: feed; row 2: groom; row 3: ball play.
// Do NOT animate the entire pet element with transforms or CSS wobble.
export const FRAME_COUNT = 16;
export const SPRITE_ATLAS = '/public/assets/momo-16frames.png';
export const KITTEN_ATLAS = '/public/assets/momo-kitten-actions-v1.png';

export function atlasFor(stage = 'adult') {
  return stage === 'kitten'
    ? { src: KITTEN_ATLAS, columns: 4, rows: 8, frames: 32 }
    : { src: SPRITE_ATLAS, columns: 4, rows: 4, frames: FRAME_COUNT };
}

// All action animation is done by replacing frames while keeping the pet anchored.
export const sequences = Object.freeze({
  blink: [
    { frame: 1, caption: '眨眨眼', phase: 'blink', ms: 130 },
    { frame: 2, caption: '眨眨眼', phase: 'blink', ms: 150 },
    { frame: 3, caption: '眨眨眼', phase: 'blink', ms: 130 },
    { frame: 0, caption: '陪著你', phase: 'idle', ms: 150 },
  ],
  feed: [
    { frame: 4, caption: '聞到香味了', phase: 'notice', ms: 260 },
    { frame: 5, caption: '張嘴吃一口', phase: 'bite', ms: 220 },
    { frame: 6, caption: '慢慢嚼', phase: 'chew', ms: 210 },
    { frame: 7, caption: '舔舔嘴巴', phase: 'lick', ms: 240 },
    { frame: 5, caption: '再吃一口', phase: 'bite', ms: 200 },
    { frame: 6, caption: '嚼嚼', phase: 'chew', ms: 220 },
    { frame: 7, caption: '吃飽了！', phase: 'reward', ms: 420 },
  ],
  play: [
    { frame: 12, caption: '找到毛線球', phase: 'notice', ms: 310 },
    { frame: 13, caption: '伸出爪爪', phase: 'reach', ms: 230 },
    { frame: 14, caption: '推推毛線球', phase: 'bat', ms: 230 },
    { frame: 15, caption: '收回小爪', phase: 'return', ms: 220 },
    { frame: 14, caption: '再拍拍一下', phase: 'bat', ms: 230 },
    { frame: 13, caption: '收回小爪', phase: 'return', ms: 230 },
    { frame: 15, caption: '玩得開心！', phase: 'reward', ms: 440 },
  ],
  clean: [
    { frame: 8, caption: '抬起小爪子', phase: 'notice', ms: 240 },
    { frame: 9, caption: '舔舔爪子', phase: 'scrub', ms: 260 },
    { frame: 10, caption: '擦擦小臉', phase: 'rinse', ms: 280 },
    { frame: 11, caption: '換另一邊', phase: 'scrub', ms: 260 },
    { frame: 9, caption: '舔舔爪子', phase: 'scrub', ms: 260 },
    { frame: 10, caption: '乾淨了！', phase: 'reward', ms: 400 },
  ],
  rest: [
    { frame: 0, caption: '準備休息', phase: 'notice', ms: 370 },
    { frame: 1, caption: '眼皮變重了', phase: 'drowsy', ms: 350 },
    { frame: 2, caption: '睡著了', phase: 'sleep', ms: 380 },
  ],
  wake: [
    { frame: 2, caption: '醒來囉', phase: 'notice', ms: 280 },
    { frame: 3, caption: '張開眼睛', phase: 'wake', ms: 240 },
    { frame: 0, caption: '精神滿滿', phase: 'reward', ms: 280 },
  ],
  pet: [
    { frame: 8, caption: '抬起爪爪', phase: 'notice', ms: 260 },
    { frame: 10, caption: '好舒服', phase: 'nuzzle', ms: 320 },
    { frame: 0, caption: '喵～', phase: 'reward', ms: 300 },
  ],
  groom: [
    { frame: 8, caption: '準備洗臉', phase: 'notice', ms: 270 },
    { frame: 9, caption: '舔舔爪子', phase: 'scrub', ms: 270 },
    { frame: 10, caption: '洗洗臉', phase: 'rinse', ms: 270 },
    { frame: 11, caption: '清爽！', phase: 'reward', ms: 340 },
  ],
  // The sheet has no distinct stretch/window illustrations. Use neutral poses
  // rather than moving, rotating or stretching the full sprite as a substitute.
  stretch: [
    { frame: 0, caption: '活動一下', phase: 'notice', ms: 360 },
    { frame: 8, caption: '伸伸爪爪', phase: 'reach', ms: 440 },
    { frame: 0, caption: '舒服！', phase: 'reward', ms: 380 },
  ],
  window: [
    { frame: 0, caption: '看看窗外', phase: 'notice', ms: 450 },
    { frame: 1, caption: '靜靜觀察', phase: 'watch', ms: 390 },
    { frame: 0, caption: '看完了', phase: 'reward', ms: 350 },
  ],
});

const kittenRow = (start, captions, phases, ms = 300) => captions.map((caption, i) => ({
  frame: start + i, caption, phase: phases[i], ms,
}));
export const kittenSequences = Object.freeze({
  ...sequences,
  rest: kittenRow(16, ['想睡了', '閉上眼睛', '放鬆休息', '熟睡中'], ['notice', 'drowsy', 'settle', 'sleep'], 380),
  wake: [19, 18, 17, 16, 0].map(frame => ({ frame, caption: '慢慢醒來', phase: 'wake', ms: 240 })),
  pet: kittenRow(20, ['看著你', '喜歡摸摸', '好舒服', '陪著你'], ['notice', 'nuzzle', 'relax', 'reward']),
  stretch: kittenRow(24, ['準備伸懶腰', '抬起雙爪', '伸展小爪', '放下小爪'], ['notice', 'reach', 'stretch', 'return'], 360),
  window: kittenRow(28, ['看向窗外', '看看左邊', '看看右邊', '回頭看你'], ['notice', 'watch', 'watch', 'return'], 380),
});

export function timelineFor(action, stage = 'adult') {
  return (stage === 'kitten' ? kittenSequences : sequences)[action] || null;
}
export function framePosition(frame, stage = 'adult') {
  const atlas = atlasFor(stage);
  if (!Number.isInteger(frame) || frame < 0 || frame >= atlas.frames) {
    throw new RangeError('Invalid sprite frame: ' + frame);
  }
  return {
    column: frame % 4,
    row: Math.floor(frame / 4),
    x: (frame % 4) * (100 / 3),
    y: Math.floor(frame / 4) * (100 / (atlas.rows - 1)),
  };
}

// Source-pixel registration, measured on the opaque feet (excluding props).
// Correct cell placement without rescaling individual poses or the pet container.
export function frameRegistration(frame, stage = 'adult') {
  framePosition(frame, stage);
  if (stage !== 'kitten') return { x: 0, y: 0 };
  const ground = [204,203,203,204,203,203,203,203,202,202,202,202,204,204,204,203,
    202,202,202,202,202,202,202,202,202,202,202,202,202,202,202,202];
  const cell = 887 / 4;
  const rowStart = Math.floor(frame / 4) * cell;
  return {
    x: [0, -.25, -.5, -1][frame % 4] * 156 / cell,
    y: (204 - ground[frame] - (Math.round(rowStart) - rowStart)) * 156 / cell,
  };
}
