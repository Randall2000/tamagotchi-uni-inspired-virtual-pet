import { applyAction, createInitialPet, hydratePet, tick } from './pet.js';
import { Navigation, menus } from './navigation.js';
import { timelineFor } from './motion.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'tower-pet-save-v1'; // Existing browser saves remain accessible.
let raw = null;
try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* Ignore malformed snapshots. */ }
let pet = hydratePet(raw);
const nav = new Navigation();
let busy = false;
let sleeping = false;
let actionTimer;
let idleTimer;
let lastTick = Date.now();
let idleIndex = 0;

const poses = {
  idle: ['momo-cat-pixel.png', '陪著你'],
  eat: ['momo-eat.png', '慢慢吃飯'],
  play: ['momo-play.png', '伸爪玩耍'],
  sleep: ['momo-sleep.png', '窩著睡覺'],
  happy: ['momo-happy.png', '開心回應'],
  groom: [0, '洗洗臉'],
  stretch: [1, '伸懶腰'],
  look: [2, '看看窗外'],
  blink: [3, '閉眼休息'],
};
const effectSymbols = {
  food: ['●', '●', '✦'],
  crumbs: ['·', '·', '✦'],
  toy: ['◆', '✦', '◆'],
  bubbles: ['○', '◯', '○'],
  hearts: ['♥', '♥', '♥'],
  sparkles: ['✦', '✧', '✦'],
  sleep: ['z', 'z', 'z'],
};

function pose(name) {
  const [source, label] = poses[name] || poses.idle;
  const atlas = typeof source === 'number';
  $('pet-sprite').hidden = atlas;
  $('pet-atlas').hidden = !atlas;
  if (atlas) {
    $('pet-atlas').style.backgroundPosition =
      (source % 2 * 100) + '% ' + (Math.floor(source / 2) * 100) + '%';
    $('pet-atlas').setAttribute('aria-label', 'MOMO ' + label);
  } else {
    $('pet-sprite').src = '/public/assets/' + source;
    $('pet-sprite').alt = 'MOMO ' + label;
  }
  $('pose-caption').textContent = label;
  $('screen').dataset.pose = name;
}

function setEffect(effect = '') {
  const symbols = effectSymbols[effect] || ['', '', ''];
  $('action-effects').dataset.effect = effect || 'none';
  [...$('action-effects').children].forEach((element, index) => {
    element.textContent = symbols[index];
  });
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
  $('pet-age').textContent = '第 ' + pet.age + ' 天';
  const room = nav.screen === 'room';
  $('device-menu').hidden = room;
  $('device-menu').dataset.screen = nav.screen;
  $('quick-actions').hidden = !room;
  $('open-menu').hidden = !room;
  $('open-menu').disabled = busy || sleeping;
  $('menu-items').replaceChildren();
  $('detail-content').replaceChildren();

  for (const button of document.querySelectorAll('[data-quick]')) {
    const action = button.dataset.quick;
    button.disabled = busy || (sleeping && action !== 'rest');
    button.classList.toggle('is-selected', sleeping && action === 'rest');
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
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-option';
    button.textContent = item.label;
    button.classList.toggle('selected', index === nav.cursor);
    if (index === nav.cursor) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => {
      if (busy || sleeping) return;
      const action = nav.choose(index);
      render();
      if (action) act(action);
    });
    li.append(button);
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
  pose('idle');
  setEffect();
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
    pose(frame.pose);
    setEffect(frame.effect);
    message(frame.caption);
    actionTimer = setTimeout(next, frame.ms);
  };
  next();
}

function sleepSettled() {
  busy = false;
  sleeping = true;
  $('room-scene').dataset.action = 'rest';
  $('room-scene').dataset.phase = 'sleep';
  pose('sleep');
  setEffect('sleep');
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
  pose('idle');
  setEffect();
  const action = nav.key(key);
  render();
  if (action) act(action);
}

function quick(action) {
  if (sleeping && action === 'rest') { wake(); return; }
  if (busy || sleeping) return;
  if (action === 'status') {
    nav.enter('status');
    render();
    return;
  }
  act(action);
}

document.querySelectorAll('[data-control]').forEach(button =>
  button.addEventListener('click', () => control(button.dataset.control)));
document.querySelectorAll('[data-quick]').forEach(button =>
  button.addEventListener('click', () => quick(button.dataset.quick)));
$('open-menu').addEventListener('click', () => {
  if (busy || sleeping || nav.screen !== 'room') return;
  nav.enter('main');
  render();
});
$('menu-back').addEventListener('click', () => {
  if (!busy && !sleeping) control('c');
});
const keys = { a: 'a', b: 'b', c: 'c', j: 'a', k: 'b', l: 'c' };
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = keys[event.key.toLowerCase()];
  if (key) { event.preventDefault(); control(key); }
});
setInterval(() => {
  if (busy || sleeping || nav.screen !== 'room' || document.hidden) return;
  const name = ['blink', 'look', 'groom', 'stretch'][idleIndex++ % 4];
  pose(name);
  idleTimer = setTimeout(() => {
    if (!busy && !sleeping && nav.screen === 'room') pose('idle');
  }, name === 'blink' ? 650 : 2200);
}, 10000);
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
pose('idle');
setEffect();
render();
