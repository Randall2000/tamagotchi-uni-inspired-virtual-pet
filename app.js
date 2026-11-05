import { applyAction, clamp, createInitialPet, hydratePet, moodFor, tick } from './pet.js';

const STORAGE_KEY = 'tower-pet-save-v1';
const $ = (id) => document.getElementById(id);
let pet = hydratePet(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
let lastActionAt = Date.now();
let currentPose = 'idle';
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
  pet = applyAction(pet, action); lastActionAt = Date.now(); save(); render();
  const copy = { feed: 'MOMO 吃飽了一點。', play: 'MOMO 開心得轉圈圈。', rest: 'MOMO 進入柔軟休息時間。' };
  pose({ feed: 'eat', play: 'play', rest: 'sleep' }[action] || 'idle');
  $('helper').textContent = copy[action]; $('helper').classList.remove('flash'); requestAnimationFrame(() => $('helper').classList.add('flash'));
}
function interactRoom(object) {
  const actions = { bed: 'rest', bowl: 'feed', toy: 'play' };
  if (actions[object]) { act(actions[object]); return; }
  pet.happiness = clamp(pet.happiness + (object === 'window' ? 4 : 8));
  lastActionAt = Date.now(); save(); render(); pose('happy');
  $('helper').textContent = object === 'window' ? 'MOMO 在窗邊看了一下外面。' : 'MOMO 開心地蹭蹭你的手。';
  $('helper').classList.remove('flash'); requestAnimationFrame(() => $('helper').classList.add('flash'));
}
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => act(button.dataset.action)));
document.querySelectorAll('[data-room-action]').forEach((button) => button.addEventListener('click', () => interactRoom(button.dataset.roomAction)));
document.addEventListener('keydown', (event) => { const map = { a: 'feed', b: 'play', c: 'rest' }; if (map[event.key.toLowerCase()]) act(map[event.key.toLowerCase()]); });
$('reset').addEventListener('click', () => { if (confirm('要把 MOMO 的存檔重置嗎？')) { pet = createInitialPet(); save(); render(); $('helper').textContent = '新的旅程開始了。'; } });
setInterval(() => { const now = Date.now(); const minutes = Math.floor((now - lastActionAt) / 60000); if (minutes > 0) { pet = tick(pet, minutes); lastActionAt = now; save(); render(); } $('clock').textContent = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }); }, 1000);
render();
