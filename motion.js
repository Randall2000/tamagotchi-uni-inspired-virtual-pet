// The UI is a visual adapter: timing and poses do not change core game rules.
// Each care action has a clear anticipation / action / reaction sequence.
export const sequences = Object.freeze({
  feed: [
    { pose: 'look', caption: '聞到香味了', effect: 'food', phase: 'notice', ms: 420 },
    { pose: 'eat', caption: '咬一小口', effect: 'food', phase: 'bite', ms: 460 },
    { pose: 'eat', caption: '嚼嚼嚼…', effect: 'crumbs', phase: 'chew', ms: 690 },
    { pose: 'happy', caption: '吃飽了！', effect: 'sparkles', phase: 'reward', ms: 570 },
  ],
  play: [
    { pose: 'look', caption: '發現玩具！', effect: 'toy', phase: 'notice', ms: 400 },
    { pose: 'play', caption: '伸爪抓抓！', effect: 'toy', phase: 'bat', ms: 650 },
    { pose: 'stretch', caption: '再玩一下', effect: 'toy', phase: 'reach', ms: 440 },
    { pose: 'happy', caption: '玩得好開心', effect: 'hearts', phase: 'reward', ms: 630 },
  ],
  clean: [
    { pose: 'look', caption: '準備洗乾淨', effect: 'bubbles', phase: 'notice', ms: 360 },
    { pose: 'groom', caption: '舔舔小爪子', effect: 'bubbles', phase: 'scrub', ms: 650 },
    { pose: 'blink', caption: '擦擦小臉', effect: 'bubbles', phase: 'rinse', ms: 500 },
    { pose: 'happy', caption: '清爽乾淨！', effect: 'sparkles', phase: 'reward', ms: 610 },
  ],
  rest: [
    { pose: 'stretch', caption: '打個哈欠', effect: 'sleep', phase: 'yawn', ms: 520 },
    { pose: 'blink', caption: '慢慢閉上眼睛', effect: 'sleep', phase: 'drowsy', ms: 480 },
    { pose: 'sleep', caption: '進入夢鄉', effect: 'sleep', phase: 'settle', ms: 430 },
  ],
  wake: [
    { pose: 'blink', caption: '醒過來了', effect: 'sparkles', phase: 'notice', ms: 400 },
    { pose: 'stretch', caption: '伸個懶腰', effect: 'sparkles', phase: 'reach', ms: 500 },
    { pose: 'idle', caption: '精神滿滿', effect: 'hearts', phase: 'reward', ms: 420 },
  ],
  pet: [
    { pose: 'look', caption: '有人在摸摸我？', effect: 'hearts', phase: 'notice', ms: 360 },
    { pose: 'happy', caption: '呼嚕呼嚕', effect: 'hearts', phase: 'nuzzle', ms: 800 },
    { pose: 'blink', caption: '好舒服', effect: 'hearts', phase: 'reward', ms: 510 },
  ],
  groom: [
    { pose: 'groom', caption: '洗洗臉', effect: 'bubbles', phase: 'scrub', ms: 900 },
    { pose: 'blink', caption: '洗好囉', effect: 'sparkles', phase: 'reward', ms: 520 },
  ],
  stretch: [
    { pose: 'blink', caption: '準備活動筋骨', effect: '', phase: 'notice', ms: 340 },
    { pose: 'stretch', caption: '大大伸懶腰', effect: 'sparkles', phase: 'reach', ms: 860 },
    { pose: 'idle', caption: '舒服！', effect: '', phase: 'reward', ms: 430 },
  ],
  window: [
    { pose: 'look', caption: '今天窗外有什麼？', effect: 'sparkles', phase: 'notice', ms: 920 },
    { pose: 'blink', caption: '靜靜觀察', effect: '', phase: 'reward', ms: 560 },
  ],
});

export function timelineFor(action) {
  return sequences[action] || null;
}
