import { applyAction, createInitialPet, GROWTH_BOND, growthStage, hydratePet, tick, actionBlockReason, needsNotice, BOND_COOLDOWN_MS } from './pet.js';
import { Navigation, menus, quickActions } from './navigation.js';
import { timelineFor, framePosition, frameRegistration, atlasFor } from './motion.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'tower-pet-save-v1'; // Existing browser saves remain accessible.
let raw = null;
try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* Ignore malformed snapshots. */ }
let pet = hydratePet(raw);
// Bounded catch-up; clock rollback never rewinds needs, growth or cooldown.
if (raw) pet = tick(pet, Math.min(240, Math.max(0, Math.floor((Date.now() - pet.lastSavedAt) / 60000))));
const nav = new Navigation();
if (document.querySelectorAll('[data-quick]').length !== quickActions.length) {
  throw new Error('Screen shortcut and controller maps are out of sync');
}
let busy = false;
let sleeping = pet.sleeping;
let actionTimer;
let pendingAction = null;
let feedback = '';
let feedbackUntil = 0;
let activeCaption = '';
let lastInputAt = -Infinity;
let lastTick = Date.now();

// A growth stage owns one complete atlas; actions never swap character sources.
function showFrame(index, label = 'MOMO') {
  const stage = growthStage(pet);
  const source = atlasFor(stage);
  const { x, y } = framePosition(index, stage);
  const offset = frameRegistration(index, stage);
  const atlas = $('pet-atlas');
  atlas.style.backgroundImage = `url('${source.src}')`;
  atlas.style.backgroundSize = `${source.columns * 100}% ${source.rows * 100}%`;
  atlas.style.backgroundPosition = `calc(${x}% + ${offset.x}px) calc(${y}% + ${offset.y}px)`;
  // Registration must not expose pixels from the neighbouring atlas cell.
  atlas.style.clipPath = `inset(${Math.max(0, offset.y)}px ${Math.max(0, -offset.x)}px ${Math.max(0, -offset.y)}px ${Math.max(0, offset.x)}px)`;
  $('pet-atlas').setAttribute('aria-label', 'MOMO ' + label);
  $('screen').dataset.frame = String(index);
  $('room-scene').setAttribute('aria-label', 'MOMO 的像素房間；' + label);
  $('room-scene').dataset.growth = growthStage(pet);
}

function message(text = '') {
  feedback = text;
  feedbackUntil = Date.now() + 5000;
  refreshStatus();
}

function refreshStatus() {
  const current = Date.now() < feedbackUntil ? feedback : '';
  $('screen-message').textContent = busy ? `${activeCaption} · C 取消` : current || needsNotice(pet);
  $('screen-message').hidden = nav.screen !== 'room';
  $('menu-hint').textContent = current || 'A 選擇　B 確認　C 返回';
  const cooldown = $('bond-cooldown');
  if (cooldown) {
    const seconds = pet.lastBondAt == null ? 0 : Math.max(0, Math.ceil((BOND_COOLDOWN_MS - Date.now() + pet.lastBondAt) / 1000));
    cooldown.textContent = seconds ? `關係加分冷卻 ${seconds} 秒` : '照顧完成可累積關係';
  }
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
  const stageLabel = stage === 'kitten' ? '幼年' : stage === 'growing' ? '成長中' : '成年';
  const nextBond = stage === 'kitten' ? GROWTH_BOND.growing : stage === 'growing' ? GROWTH_BOND.adult : null;
  $('pet-age').textContent = `MOMO · ${stageLabel}`;
  $('bond-value').textContent = `${pet.bond}/100`;
  $('bond-hearts').setAttribute('aria-label', `關係度 ${pet.bond} / 100`);
  $('bond-hearts').replaceChildren(...Array.from({length: 5}, (_, i) => {
    const heart = document.createElement('span');
    heart.className = 'pixel-heart';
    heart.setAttribute('aria-hidden', 'true');
    heart.style.setProperty('--fill', `${Math.max(0, Math.min(100, (pet.bond - i * 20) * 5))}%`);
    return heart;
  }));
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


  const titles = {
    main: '生活選單', food: '吃點什麼？', care: '清潔照顧', toys: '一起玩耍',
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
    const label = document.createElement('span');
    label.textContent = item.label;
    li.append(label);
    if (item.hint) { const hint = document.createElement('small'); hint.textContent = item.hint; li.append(hint); }
    li.classList.toggle('selected', index === nav.cursor);
    if (index === nav.cursor) li.setAttribute('aria-current', 'true');
    $('menu-items').append(li);
    if (index === nav.cursor) requestAnimationFrame(() => { const list = $('menu-items'); if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight; });
  }

  if (nav.screen === 'status') {
    const summary = document.createElement('p');
    summary.className = 'growth-summary';
    summary.textContent = nextBond === null ? `成年 · 第 ${pet.age} 天 · 關係 ${pet.bond}` : `第 ${pet.age} 天 · 再 ${nextBond - pet.bond} 點關係長大`;
    $('detail-content').append(summary);
    const dl = document.createElement('dl');
    for (const [name, value] of [['飽足', pet.hunger], ['心情', pet.happiness], ['清潔', pet.hygiene], ['精力', pet.energy]]) {
      const dt = document.createElement('dt'); dt.textContent = name;
      const dd = document.createElement('dd');
      const meter = document.createElement('meter'); meter.min = 0; meter.max = 100; meter.low = 25; meter.high = 65; meter.optimum = 100; meter.value = value; meter.setAttribute('aria-label', name);
      const number = document.createElement('span'); number.textContent = Math.round(value);
      dd.append(meter, number); dl.append(dt, dd);
    }
    $('detail-content').append(dl);
    const note = document.createElement('p'); note.className = 'growth-note'; note.id = 'bond-cooldown';
    const remaining = pet.lastBondAt == null ? 0 : Math.max(0, Math.ceil((BOND_COOLDOWN_MS - Date.now() + pet.lastBondAt) / 1000));
    note.textContent = remaining ? `關係加分冷卻 ${remaining} 秒` : '照顧完成可累積關係';
    $('detail-content').append(note);
  }
  refreshStatus();
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

function runMotion(action, onDone = idle, recoveryFrames = null) {
  const frames = recoveryFrames || timelineFor(action === 'snack' ? 'feed' : action, growthStage(pet));
  if (!frames) { onDone(); return; }
  clearTimeout(actionTimer);
  let index = 0;
  const next = () => {
    if (index >= frames.length) { onDone(); return; }
    const frame = frames[index++];
    $('room-scene').dataset.action = action;
    $('room-scene').dataset.phase = frame.phase;
    activeCaption = frame.caption;
    showFrame(frame.frame, frame.caption);
    refreshStatus();
    actionTimer = setTimeout(next, frame.ms);
  };
  next();
}

function sleepSettled() {
  busy = false;
  sleeping = true;
  $('room-scene').dataset.action = 'rest';
  $('room-scene').dataset.phase = 'sleep';
  showFrame(timelineFor('rest', growthStage(pet)).at(-1).frame, '睡著了');
  render();
  message('熟睡中 · B / C 喚醒');
}

function wake() {
  if (!sleeping || busy) return;
  sleeping = false;
  pet = { ...pet, sleeping: false };
  save();
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
  if (!timelineFor(action === 'snack' ? 'feed' : action)) return;
  const blocked = actionBlockReason(pet, action);
  if (blocked) { message(blocked); return; }
  pendingAction = { action, navigation: { screen: nav.screen, cursor: nav.cursor, quickCursor: nav.quickCursor, stack: [...nav.stack] } };
  busy = true;
  nav.home();
  render();
  runMotion(action, () => completeAction());
}

function completeAction() {
  if (!pendingAction) return;
  const transaction = pendingAction;
  pendingAction = null; // Consume exactly once, before effects or callbacks.
  const previousBond = pet.bond;
  const oldStage = growthStage(pet);
  pet = applyAction(pet, transaction.action);
  save();
  if (transaction.action === 'rest') { sleepSettled(); return; }
  Object.assign(nav, transaction.navigation);
  idle();
  const labels = {feed:'吃飽一點了',snack:'點心吃完了',play:'玩得很開心',clean:'身體乾淨了',groom:'小臉洗好了',pet:'喜歡你的陪伴',stretch:'伸展完成',window:'看完窗外了'};
  message(growthStage(pet) !== oldStage ? '關係更近了 · MOMO 長大了' : `${labels[transaction.action]}${pet.bond > previousBond ? ` · 關係 +${pet.bond - previousBond}` : ''}`);
}

function cancelAction() {
  const transaction = pendingAction;
  if (!transaction) return;
  pendingAction = null;
  const recovery = timelineFor(transaction.action, growthStage(pet)).slice(-2)
    .map(frame => ({ ...frame, caption: '收回動作', phase: 'recover', ms: 180 }));
  runMotion(transaction.action, () => {
    Object.assign(nav, transaction.navigation);
    idle();
    message('已取消 · 數值未變更');
  }, recovery);
}

function control(key) {

  if (sleeping) {
    if (key === 'b' || key === 'c') wake();
    else message('熟睡中 · B / C 喚醒');
    return;
  }
  if (busy) {
    if (key === 'c') cancelAction();
    else message('動作進行中 · C 取消');
    return;
  }
  // A/B/C input interrupts an idle blink without leaving a timer running.
  clearTimeout(actionTimer);
  $('room-scene').dataset.action = 'idle';
  $('room-scene').dataset.phase = 'idle';
  showFrame(0, '陪著你');
  feedback = '';
  const action = nav.key(key);
  render();
  if (action) act(action);
}

function acceptInput(key) {
  const now = performance.now();
  if (now - lastInputAt < 120) return;
  lastInputAt = now;
  const button = document.querySelector(`[data-control="${key}"]`);
  button.classList.add('is-pressed');
  setTimeout(() => button.classList.remove('is-pressed'), 140);
  control(key);
}

// The three physical-style buttons are the only pointer-input controls.
document.querySelectorAll('[data-control]').forEach(button =>
  button.addEventListener('click', () => acceptInput(button.dataset.control)));
const keys = { a: 'a', b: 'b', c: 'c', j: 'a', k: 'b', l: 'c' };
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = keys[event.key.toLowerCase()];
  if (key) { event.preventDefault(); acceptInput(key); }
});
setInterval(() => {
  if (busy || nav.screen !== 'room' || document.hidden) return;
  if (sleeping) { runMotion('sleep', sleepSettled); return; }
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
  refreshStatus();
  $('clock').textContent = new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}, 1000);
if (sleeping) sleepSettled(); else idle();
save();

// Register live display and hit areas to the actual 1127 x 1396 shell bitmap.
const bezel = document.querySelector('.bezel');
new ResizeObserver(() => {
  const { width, height } = bezel.getBoundingClientRect();
  const scale = Math.min(width, height) / 240;
  $('screen').style.transform = `scale(${scale})`;
  $('screen').style.left = `${(width - 240 * scale) / 2}px`;
}).observe(bezel);
const icons = {
  food:['0000000','0101010','0000000','1111111','1000001','0111110','0011100'],
  care:['0001000','0011100','0011100','0111110','1111111','1111111','0111110'],
  play:['0001000','0001000','0011100','1111111','0011100','0001000','0001000'],
  heart:['0110110','1111111','1111111','0111110','0011100','0001000','0000000'],
  status:['0001000','0001000','0101010','0101010','0101010','0101010','1111111'],
  menu:['1111111','0000000','1111111','0000000','1111111','0000000','0000000'],
};
for (const icon of document.querySelectorAll('[data-icon]')) {
  icon.style.setProperty('--pixels', icons[icon.dataset.icon].flatMap((row,y)=>[...row].flatMap((cell,x)=>cell==='1'?[`${x*2}px ${y*2}px 0 currentColor`]:[])).join(','));
}
