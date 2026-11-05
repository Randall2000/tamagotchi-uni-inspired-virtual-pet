import { applyAction, createInitialPet, growthStage, hydratePet, tick } from './pet.js';
import { Navigation, menus, quickActions } from './navigation.js';
import { timelineFor, framePosition, frameOffset, SPRITE_ATLAS } from './motion.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'tower-pet-save-v1'; // Existing browser saves remain accessible.
let raw = null;
try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* Ignore malformed snapshots. */ }
let pet = hydratePet(raw);
const nav = new Navigation();
if (document.querySelectorAll('[data-quick]').length !== quickActions.length) {
  throw new Error('Screen shortcut and controller maps are out of sync');
}
let busy = false;
let sleeping = false;
let actionTimer;
let idleTimer;
let lastTick = Date.now();

// Frames change inside one fixed 4x4 atlas cell; never move the whole character.
function showFrame(index, label = 'MOMO') {
  const { x, y } = framePosition(index);
  const offset = frameOffset(index);
  const atlas = $('pet-atlas');
  const kittenAtRest = growthStage(pet) === 'kitten' && $('room-scene').dataset.action === 'idle' && index === 0;
  atlas.style.backgroundImage = kittenAtRest
    ? "url('/public/assets/momo-kitten.png')"
    : `url('${SPRITE_ATLAS}')`;
  atlas.style.backgroundSize = kittenAtRest ? 'contain' : '400% 400%';
  atlas.style.backgroundPosition = kittenAtRest
    ? 'center bottom'
    : `calc(${x}% + ${offset.x}px) calc(${y}% + ${offset.y}px)`;
  $('pet-atlas').setAttribute('aria-label', 'MOMO ' + label);
  $('screen').dataset.frame = String(index);
  $('room-scene').setAttribute('aria-label', 'MOMO 的像素房間；' + label);
  $('room-scene').dataset.growth = growthStage(pet);
}

function message(text = '') {
  $('screen-message').textContent = text;
  $('screen-message').hidden = !text || nav.screen !== 'room';
}

function save() {
  try {
    pet.lastSavedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
    $('screen').dataset.saveStatus = 'ok';
    return true;
  } catch {
    $('screen').dataset.saveStatus = 'error';
    message('儲存失敗，請檢查瀏覽器空間');
    return false;
  }
}

function render() {
  const stage = growthStage(pet);
  $('pet-age').textContent = `${stage === 'kitten' ? '幼年' : stage === 'growing' ? '成長中' : '成年'} · 第 ${pet.age} 天`;
  const room = nav.screen === 'room';
  $('device-menu').hidden = room;
  $('device-menu').dataset.screen = nav.screen;
  $('quick-actions').hidden = !room;
  $('menu-items').replaceChildren();
  $('detail-content').replaceChildren();

  // Always show which icon the A key selected; screen icons are not interactive.
  for (const [index, item] of [...document.querySelectorAll('[data-quick]')].entries()) {
    const selected = index === nav.quickCursor;
    item.classList.toggle('is-selected', selected);
    item.classList.toggle('is-locked', busy || sleeping);
    if (selected) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
  }
  $('rest-label').textContent = sleeping ? '喚醒' : '睡覺';

  const titles = {
    main: '照顧與選單',
    interact: '其他互動',
    settings: '設定',
    status: 'MOMO 的狀態',
    confirm: '重新開始？',
  };
  $('menu-title').textContent = titles[nav.screen] || '';
  const items = nav.screen === 'confirm'
    ? [{ label: '保留進度' }, { label: '確定重新開始' }]
    : menus[nav.screen];
  $('menu-count').textContent = items
    ? (nav.cursor + 1) + '/' + items.length
    : '';

  for (const [index, item] of (items || []).entries()) {
    const li = document.createElement('li');
    li.className = 'menu-option';
    li.textContent = item.label;
    li.classList.toggle('selected', index === nav.cursor);
    if (index === nav.cursor) li.setAttribute('aria-current', 'true');
    $('menu-items').append(li);
  }

  if (nav.screen === 'status') {
    const dl = document.createElement('dl');
    for (const [name, value] of [
      ['飽足', pet.hunger],
      ['心情', pet.happiness],
      ['清潔', pet.hygiene],
      ['精力', pet.energy],
      ['金幣', pet.coins],
    ]) {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = name;
      dd.textContent = String(value);
      dl.append(dt, dd);
    }
    $('detail-content').append(dl);
  }

  if (!room || (!busy && !sleeping)) message('');
}

function idle() {
  clearTimeout(actionTimer);
  busy = false;
  sleeping = false;
  $('room-scene').dataset.action = 'idle';
  $('room-scene').dataset.phase = 'idle';
  showFrame(0, '陪著你');
  render();
}

function runMotion(action, onDone = idle) {
  const frames = timelineFor(action);
  if (!frames) { onDone(); return; }
  clearTimeout(actionTimer);
  let index = 0;
  const next = () => {
    if (index >= frames.length) { onDone(); return; }
    const frame = frames[index++];
    $('room-scene').dataset.action = action;
    $('room-scene').dataset.phase = frame.phase;
    showFrame(frame.frame, frame.caption);
    actionTimer = setTimeout(next, frame.ms);
  };
  next();
}

function sleepSettled() {
  busy = false;
  sleeping = true;
  $('room-scene').dataset.action = 'rest';
  $('room-scene').dataset.phase = 'sleep';
  showFrame(2, '睡著了');
  render();
  message('熟睡中 · B / C 喚醒');
}

function wake() {
  if (!sleeping || busy) return;
  sleeping = false;
  busy = true;
  render();
  runMotion('wake');
}

function act(action) {
  if (busy || sleeping) return;
  if (action === 'save') {
    nav.home();
    render();
    if (save()) message('進度已儲存');
    return;
  }
  if (action === 'reset') {
    pet = createInitialPet();
    nav.home();
    idle();
    save();
    message('已開始新的旅程');
    return;
  }
  if (!timelineFor(action)) return;
  pet = applyAction(pet, action);
  clearTimeout(idleTimer);
  busy = true;
  nav.home();
  render();
  save();
  runMotion(action, action === 'rest' ? sleepSettled : idle);
}

function control(key) {
  clearTimeout(idleTimer);
  if (sleeping) {
    if (key === 'b' || key === 'c') wake();
    return;
  }
  if (busy) {
    if (key === 'c') idle();
    return;
  }
  // A/B/C input interrupts an idle blink without leaving a timer running.
  clearTimeout(actionTimer);
  $('room-scene').dataset.action = 'idle';
  $('room-scene').dataset.phase = 'idle';
  showFrame(0, '陪著你');
  const action = nav.key(key);
  render();
  if (action) act(action);
}

// The three physical-style buttons are the only pointer-input controls.
document.querySelectorAll('[data-control]').forEach(button =>
  button.addEventListener('click', () => control(button.dataset.control)));
const keys = { a: 'a', b: 'b', c: 'c', j: 'a', k: 'b', l: 'c' };
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = keys[event.key.toLowerCase()];
  if (key) { event.preventDefault(); control(key); }
});
setInterval(() => {
  if (busy || sleeping || nav.screen !== 'room' || document.hidden) return;
  runMotion('blink', () => {
    $('room-scene').dataset.action = 'idle';
    $('room-scene').dataset.phase = 'idle';
    showFrame(0, '陪著你');
  });
}, 8000);
setInterval(() => {
  const now = Date.now();
  const minutes = Math.floor((now - lastTick) / 60000);
  if (minutes > 0) {
    pet = tick(pet, minutes);
    lastTick += minutes * 60000;
    save();
    render();
  }
  $('clock').textContent = new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}, 1000);
showFrame(0, '陪著你');
render();
