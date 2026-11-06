// Momo 19-action motion preview adapter. Original 64-frame atlases remain untouched.
// These are blocking poses recomposed from the existing art, not hand-approved master frames.
export const MOTION_LIBRARY = Object.freeze({
  idle:[24,12,'loop'], walk:[16,12,'loop'], eat:[32,12,'one-shot'],
  snack:[24,12,'one-shot'], drink:[24,12,'one-shot'], tail_wag:[16,12,'loop'],
  sleep_prep:[24,12,'one-shot'], sleep:[24,8,'loop'], wake:[24,12,'one-shot'],
  happy:[16,12,'one-shot'], sad:[16,8,'one-shot'], angry:[16,12,'one-shot'],
  play:[32,12,'one-shot'], groom:[32,12,'one-shot'], curious:[16,12,'one-shot'],
  petting:[24,12,'one-shot'], yawn:[16,12,'one-shot'],
  sick:[16,8,'one-shot'], toilet:[24,12,'one-shot'],
});
const ALIASES = Object.freeze({
  blink:'idle', feed:'eat', clean:'groom', rest:'sleep_prep',
  pet:'petting', window:'curious',
});
export const MOTION_ACTIONS = Object.freeze(Object.keys(MOTION_LIBRARY));
export function canonicalMotion(action) {
  return ALIASES[action] || action;
}
export function motionAsset(action, stage='adult') {
  const name=canonicalMotion(action);
  const spec=MOTION_LIBRARY[name];
  if (!spec) return null;
  const age=stage==='adult' ? 'adult' : 'kitten';
  const [frames,fps,playback]=spec;
  return {
    action:name, stage:age, frames, fps, playback,
    columns:8, rows:Math.ceil(frames/8), cellPx:128,
    src:`/public/assets/momo-motions-preview/${age}/${name}.png`,
    quality:'preview',
  };
}
export function motionFramePosition(index,asset) {
  if (!asset || !Number.isInteger(index) || index<0 || index>=asset.frames) {
    throw new RangeError('Invalid action frame: '+index);
  }
  return { x:(index%asset.columns)*100/(asset.columns-1),
    y:Math.floor(index/asset.columns)*100/(asset.rows-1) };
}
export function motionTimeline(action,stage='adult') {
  const asset=motionAsset(action,stage);
  if (!asset) return null;
  const ms=1000/asset.fps;
  return Array.from({length:asset.frames},(_,frame)=>({
    frame, assetAction:asset.action,
    ms, caption:({
      idle:'陪著你',walk:'散步中',eat:'吃正餐',snack:'吃點心',drink:'喝水中',
      tail_wag:'搖搖尾巴',sleep_prep:'準備睡覺',sleep:'熟睡中',wake:'慢慢醒來',
      happy:'好開心',sad:'有點難過',angry:'有點生氣',play:'玩毛線球',groom:'舔舔毛',
      curious:'好奇觀察',petting:'舒服地被摸摸',yawn:'打個呵欠',sick:'需要照顧',toilet:'正在如廁',
    })[asset.action],
    phase:frame<asset.frames/6?'anticipation':frame>=asset.frames*5/6?'recover':'action',
  }));
}
