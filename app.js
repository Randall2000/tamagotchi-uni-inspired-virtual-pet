import { applyAction, clamp, createInitialPet, hydratePet, moodFor, tick } from './pet.js';

const STORAGE_KEY = 'tower-pet-save-v1';
const $ = (id) => document.getElementById(id);
let pet = hydratePet(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
let lastActionAt = Date.now();
let currentPose = 'idle';
let menuOpen = false;
let selectedAction = 0;
const actions = [
  { id: 'feed', title: 'FEED', place: '食碗' },
  { id: 'play', title: 'PLAY', place: '毛線球' },
  { id: 'rest', title: 'REST', place: '床' },
  { id: 'pet', title: 'PET', place: '摸摸 MOMO' },
  { id: 'window', title: 'LOOK', place: '看看窗外' },
];
const poses = {
  idle: '/public/assets/momo-cat-pixel.png',
  eat: '/public/assets/momo-eat.png',
  play: '/public/assets/momo-play.png',
  sleep: '/public/assets/momo-sleep.png',
  happy: '/public/assets/momo-happy.png',
};
const poseAlt = {
  idle: 'MOMO 坐著待機', eat: 'MOMO 低頭吃東西', play: 'MOMO 舉起爪子玩耍',
  sleep: 'MOMO 蜷起身體睡覺', happy: 'MOMO 開心地舉爪回應',
};

function save() { pet.lastSavedAt = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(pet)); document.querySelector('.save-dot').classList.add('pulse'); setTimeout(() => document.querySelector('.save-dot').classList.remove('pulse'), 500); }
function render() {
  const mood = moodFor(pet);
  $('hunger-meter').style.width = `${pet.hunger}%`; $('joy-meter').style.width = `${pet.happiness}%`;
  $('hunger-value').textContent = pet.hunger; $('joy-value').textContent = pet.happiness; $('coins').textContent = pet.coins;
  $('mood-label').textContent = mood.label; $('mood-face').textContent = mood.face; $('pet-age').textContent = `DAY ${String(pet.age).padStart(2, '0')}`;
  $('pet-sprite').src = poses[currentPose];
  renderMenu();
}
function renderMenu() {
  const panel = $('device-menu');
  const selected = actions[selectedAction];
  panel.classList.toggle('is-open', menuOpen);
  panel.querySelector('.menu-state').textContent = menuOpen ? `ACTION ${selectedAction + 1}/05` : 'READY';
  $('menu-display').textContent = menuOpen ? `${selected.title}  ·  ${selected.place}` : 'A 開啟行動選單';
  $('menu-hint').textContent = menuOpen ? 'A 下一項 · B 確認 · C 返回' : 'B 選擇 · C 返回待機';
}
function pose(name) {
  currentPose = name;
  const sprite = $('pet-sprite');
  sprite.className = 'pixel-pet';
  sprite.alt = poseAlt[name];
  requestAnimationFrame(() => sprite.classList.add(`action-${name}`));
  sprite.src = poses[name];
}
function act(action) {
  if (['feed', 'play', 'rest'].includes(action)) pet = applyAction(pet, action);
  else pet.happiness = clamp(pet.happiness + (action === 'window' ? 4 : 8));
  lastActionAt = Date.now(); save();
  pose({ feed: 'eat', play: 'play', rest: 'sleep', pet: 'happy', window: 'happy' }[action]);
  const copy = {
    feed: 'MOMO 吃飽了一點。', play: 'MOMO 開心得玩起毛線球。', rest: 'MOMO 在小床上休息。',
    pet: 'MOMO 開心地蹭蹭你的手。', window: 'MOMO 靠著窗邊看外面。',
  };
  $('helper').textContent = copy[action]; $('helper').classList.remove('flash'); requestAnimationFrame(() => $('helper').classList.add('flash'));
  render();
}
function control(key) {
  if (key === 'a') {
    if (!menuOpen) menuOpen = true;
    else selectedAction = (selectedAction + 1) % actions.length;
    renderMenu(); return;
  }
  if (key === 'b') {
    if (!menuOpen) { $('helper').textContent = '先按 A 開啟行動選單。'; return; }
    const action = actions[selectedAction].id;
    menuOpen = false; renderMenu(); act(action); return;
  }
  if (key === 'c') {
    menuOpen = false; renderMenu();
    $('helper').textContent = 'MOMO 正在房間裡陪著你。';
  }
}
document.querySelectorAll('[data-control]').forEach((button) => button.addEventListener('click', () => control(button.dataset.control)));
document.addEventListener('keydown', (event) => { const key = event.key.toLowerCase(); if (['a', 'b', 'c'].includes(key)) control(key); });
$('reset').addEventListener('click', () => { if (confirm('要把 MOMO 的存檔重置嗎？')) { pet = createInitialPet(); save(); render(); $('helper').textContent = '新的旅程開始了。'; } });
setInterval(() => { const now = Date.now(); const minutes = Math.floor((now - lastActionAt) / 60000); if (minutes > 0) { pet = tick(pet, minutes); lastActionAt = now; save(); render(); } $('clock').textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }); }, 1000);
render();
