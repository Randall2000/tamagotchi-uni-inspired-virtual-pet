import { applyAction, clamp, createInitialPet, hydratePet, tick } from './pet.js';
import { Navigation, menus } from './navigation.js';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'tower-pet-save-v1';
let raw;
try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { raw = null; }
let pet = hydratePet(raw);
const nav = new Navigation();
let busy = false, sleeping = false, actionTimer, idleTimer, lastTick = Date.now();
const poses = {
  idle: ['momo-cat-pixel.png', '陪著你'], eat: ['momo-eat.png', '慢慢吃飯'],
  play: ['momo-play.png', '伸爪玩耍'], sleep: ['momo-sleep.png', '窩著睡覺'], happy: ['momo-happy.png', '開心回應'],
  groom: [0, '舔舔爪子、洗洗臉'], stretch: [1, '伸個懶腰'], look: [2, '看看窗外'], blink: [3, '閉眼休息一下'],
};
function pose(name) {
  const [source, label] = poses[name];
  const atlas = typeof source === 'number';
  $('pet-sprite').hidden = atlas;
  $('pet-atlas').hidden = !atlas;
  if (atlas) {
    $('pet-atlas').style.backgroundPosition = `${source % 2 * 100}% ${Math.floor(source / 2) * 100}%`;
    $('pet-atlas').setAttribute('aria-label', `MOMO ${label}`);
  } else { $('pet-sprite').src = `/public/assets/${source}`; $('pet-sprite').alt = `MOMO ${label}`; }
  $('pose-caption').textContent = label;
  $('screen').dataset.pose = name;
}
function message(text) { $('screen-message').textContent = text; }
function save() {
  try { pet.lastSavedAt = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(pet)); return true; }
  catch { message('無法儲存，請檢查瀏覽器空間'); return false; }
}
function render() {
  $('pet-age').textContent = `第 ${pet.age} 天`;
  $('device-menu').hidden = nav.screen === 'room';
  $('menu-items').replaceChildren();
  $('detail-content').replaceChildren();
  const titles = { main: '主選單', care: '照顧', interact: '互動', settings: '設定', status: 'MOMO 的狀態', confirm: '重新開始？' };
  $('menu-title').textContent = titles[nav.screen] || '';
  const items = nav.screen === 'confirm' ? [{ label: '保留進度' }, { label: '確定重新開始' }] : menus[nav.screen];
  $('menu-count').textContent = items ? `${nav.cursor + 1}/${items.length}` : '';
  for (const [i, item] of (items || []).entries()) {
    const li = document.createElement('li'); li.textContent = item.label;
    li.classList.toggle('selected', i === nav.cursor);
    if (i === nav.cursor) li.setAttribute('aria-current', 'true');
    $('menu-items').append(li);
  }
  if (nav.screen === 'status') {
    const dl = document.createElement('dl');
    for (const [name, value] of [['飽足', pet.hunger], ['心情', pet.happiness], ['精力', pet.energy], ['金幣', pet.coins]]) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = name; dd.textContent = String(value); dl.append(dt, dd);
    }
    $('detail-content').append(dl);
  }
  if (nav.screen !== 'room') message('A 選擇 · B 確認 · C 返回');
  else if (!busy && !sleeping) message('A 選單 · B 選單');
}
function finish() {
  clearTimeout(actionTimer); busy = false; pose('idle'); render();
}
function act(action) {
  if (action === 'save') { render(); if (save()) message('進度已儲存'); return; }
  if (action === 'reset') { pet = createInitialPet(); sleeping = false; finish(); save(); return; }
  if (['feed', 'play', 'rest'].includes(action)) pet = applyAction(pet, action);
  else if (action === 'pet') pet.happiness = clamp(pet.happiness + 8);
  const name = { feed: 'eat', play: 'play', rest: 'sleep', groom: 'groom', stretch: 'stretch', pet: 'happy', window: 'look' }[action];
  sleeping = action === 'rest'; busy = !sleeping;
  pose(name); render();
  message(sleeping ? '睡覺中 · B 或 C 喚醒' : 'MOMO 正在回應你…');
  const saved = save();
  if (!sleeping) actionTimer = setTimeout(() => { finish(); if (!saved) message('無法儲存，請檢查瀏覽器空間'); }, 2600);
}
function control(key) {
  clearTimeout(idleTimer);
  if (sleeping) { if (key === 'b' || key === 'c') { sleeping = false; finish(); } return; }
  if (busy) { if (key === 'c') finish(); return; }
  pose('idle');
  const action = nav.key(key);
  render();
  if (action) act(action);
}
document.querySelectorAll('[data-control]').forEach(button => button.addEventListener('click', () => control(button.dataset.control)));
const keys = { a: 'a', b: 'b', c: 'c', j: 'a', k: 'b', l: 'c' };
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = keys[event.key.toLowerCase()];
  if (key) { event.preventDefault(); control(key); }
});
let idleIndex = 0;
setInterval(() => {
  if (busy || sleeping || nav.screen !== 'room' || document.hidden) return;
  const name = ['blink', 'look', 'groom', 'stretch'][idleIndex++ % 4];
  pose(name);
  idleTimer = setTimeout(() => { if (!busy && !sleeping && nav.screen === 'room') pose('idle'); }, name === 'blink' ? 650 : 2200);
}, 10000);
setInterval(() => {
  const now = Date.now(), minutes = Math.floor((now - lastTick) / 60000);
  if (minutes > 0) { pet = tick(pet, minutes); lastTick += minutes * 60000; save(); render(); }
  $('clock').textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}, 1000);
pose('idle'); render();
