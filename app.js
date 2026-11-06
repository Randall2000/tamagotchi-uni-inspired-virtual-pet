import { applyAction, createInitialPet, GROWTH_BOND, growthStage, hydratePet, tick, actionBlockReason, needsNotice, BOND_COOLDOWN_MS, WAKE_RULES } from './pet.js';
import { Navigation, menus, quickActions, makeDebouncer } from './navigation.js';
import { timelineFor, framePosition, frameRegistration, atlasFor, pickIdle } from './motion.js';
import { motionAsset, motionFramePosition, motionTimeline } from './motion-pack.js';
import { planWalk, walkSample } from './roaming.js';

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
const debounced = makeDebouncer();
let lastTick = Date.now();
let roomX = 0;
let walkRequest = 0;
let idleTimer;
let idleFrameTimer;
let lastAmbientId = null;
let walkNext = true;
const walkReady = { adult: false, kitten: false };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const stage of ['adult', 'kitten']) {
  const image = new Image();
  image.src = motionAsset('walk', stage).src;
  image.decode().then(() => { walkReady[stage] = true; })
    .catch(() => { /* Fall back to idle when an age-specific walk asset is unavailable. */ });
}

// Character identity comes from a stage-specific sheet. Never alter the whole sprite per pose.
function showFrame(index, label = '陪著你', motionAction = null) {
  const stage = growthStage(pet);
  const preview = motionAction ? motionAsset(motionAction, stage) : null;
  const atlas = $('pet-atlas');
  $('pet-facing').style.transform = 'none';
  if (preview) {
    const { x, y } = motionFramePosition(index, preview);
    atlas.dataset.kind = 'motion';
    atlas.style.backgroundImage = `url('${preview.src}')`;
    atlas.style.backgroundSize = `${preview.columns * 100}% ${preview.rows * 100}%`;
    atlas.style.backgroundPosition = `${x}% ${y}%`;
    atlas.style.clipPath = 'none';
  } else {
    const source = atlasFor(stage);
    const { x, y } = framePosition(index, stage);
    const offset = frameRegistration(index, stage);
    atlas.dataset.kind = 'care';
    atlas.style.backgroundImage = `url('${source.src}')`;
    atlas.style.backgroundSize = `${source.columns * 100}% ${source.rows * 100}%`;
    atlas.style.backgroundPosition = `calc(${x}% + ${offset.x}px) calc(${y}% + ${offset.y}px)`;
    atlas.style.clipPath = `inset(${Math.max(0, offset.y)}px ${Math.max(0, -offset.x)}px ${Math.max(0, -offset.y)}px ${Math.max(0, offset.x)}px)`;
  }
  atlas.setAttribute('aria-label', `${pet.name} ${label}`);
  $('screen').dataset.frame = preview ? `${preview.action}-${index}` : String(index);
  $('room-scene').setAttribute('aria-label', `${pet.name} 的像素房間；${label}`);
  $('room-scene').dataset.growth = stage;
}

function message(text = '') {
  feedback = text;
  feedbackUntil = Date.now() + 5000;
  refreshStatus();
}

function refreshStatus() {
  const current = Date.now() < feedbackUntil ? feedback : '';
  $('screen-message').textContent = busy
    ? `${activeCaption} · C 取消`
    : $('room-scene').dataset.ambient === 'true'
      ? activeCaption
      : current || needsNotice(pet);
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
  $('pet-age').textContent = `${pet.name} · ${stageLabel}`;
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
    main: '選單',
    settings: '設定',
    status: `${pet.name} 的狀態`,
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

  if (nav.screen === 'settings') {
    const version = document.createElement('p');
    version.className = 'growth-note';
    version.textContent = `版本 v${document.documentElement.dataset.version}`;
    $('detail-content').append(version);
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
      // Ten hard-edged blocks instead of a smooth meter, coloured by level.
      const bar = document.createElement('span');
      bar.className = 'pixel-bar';
      bar.dataset.level = value < 25 ? 'low' : value < 65 ? 'mid' : 'high';
      bar.setAttribute('role', 'meter'); bar.setAttribute('aria-label', name);
      bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(Math.round(value)));
      bar.append(...Array.from({ length: 10 }, (_, i) => { const cell = document.createElement('i'); if (value >= (i + 1) * 10 - 5) cell.className = 'on'; return cell; }));
      const number = document.createElement('span'); number.textContent = Math.round(value);
      dd.append(bar, number); dl.append(dt, dd);
    }
    $('detail-content').append(dl);
    const note = document.createElement('p'); note.className = 'growth-note'; note.id = 'bond-cooldown';
    const remaining = pet.lastBondAt == null ? 0 : Math.max(0, Math.ceil((BOND_COOLDOWN_MS - Date.now() + pet.lastBondAt) / 1000));
    note.textContent = remaining ? `關係加分冷卻 ${remaining} 秒` : '照顧完成可累積關係';
    $('detail-content').append(note);
  }
  refreshStatus();
}

// While the pet is awake and left alone, cycle through actual idle sprite
// frames at the atlas FPS. This only changes background-position: no wobble,
// rotation, scale or translate of the character container is permitted.
function stopIdleFrames() {
  clearTimeout(idleFrameTimer);
  idleFrameTimer = undefined;
}

function playIdleFrames() {
  stopIdleFrames();
  const atlas = motionAsset('idle', growthStage(pet));
  if (!atlas || sleeping || busy || nav.screen !== 'room' || document.hidden ||
      reducedMotion.matches || walkRequest) return;
  let frame = 0;
  const nextFrame = () => {
    if (sleeping || busy || nav.screen !== 'room' || document.hidden ||
        reducedMotion.matches || walkRequest || $('room-scene').dataset.action !== 'idle') return;
    showFrame(frame, '陪著你', 'idle');
    frame = (frame + 1) % atlas.frames;
    idleFrameTimer = setTimeout(nextFrame, 1000 / atlas.fps);
  };
  nextFrame();
}

function idle() {
  clearTimeout(actionTimer);
  busy = false;
  sleeping = false;
  $('room-scene').dataset.action = 'idle';
  $('room-scene').dataset.phase = 'idle';
  $('room-scene').dataset.ambient = 'false';
  activeCaption = '';
  showFrame(0, '陪著你', 'idle');
  render();
  playIdleFrames();
  scheduleIdle();
}

function runMotion(action, onDone = idle, recoveryFrames = null, ambient = false) {
  stopIdleFrames();
  $('room-scene').dataset.ambient = ambient ? 'true' : 'false';
  const frames = recoveryFrames || motionTimeline(action, growthStage(pet)) || timelineFor(action, growthStage(pet));
  if (!frames) { onDone(); return; }
  clearTimeout(actionTimer);
  let index = 0;
  const next = () => {
    if (index >= frames.length) { onDone(); return; }
    const frame = frames[index++];
    $('room-scene').dataset.action = action;
    $('room-scene').dataset.phase = frame.phase;
    activeCaption = frame.caption;
    showFrame(frame.frame, frame.caption, frame.assetAction);
    refreshStatus();
    actionTimer = setTimeout(next, frame.ms);
  };
  next();
}

function sleepSettled() {
  clearTimeout(idleTimer);
  stopIdleFrames();
  busy = false;
  sleeping = true;
  $('room-scene').dataset.action = 'rest';
  $('room-scene').dataset.phase = 'sleep';
  showFrame(0, '安靜熟睡', 'sleep');
  render();
  message('熟睡中 · B / C 喚醒');
  if (!reducedMotion.matches) runMotion('sleep', sleepSettled);
}

function wake(note = '') {
  if (!sleeping || busy) return;
  sleeping = false;
  pet = { ...pet, sleeping: false };
  save();
  busy = true;
  render();
  runMotion('wake', () => { idle(); if (note) message(note); });
}

// Why a sleeping pet got up by itself (see WAKE_RULES).
function wakeNote() {
  return pet.hunger < WAKE_RULES.hungryBelow ? '肚子餓醒了 · 先吃餐食' : '睡飽起床了';
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
    roomX = 0;
    $('pet-visual').style.translate = '0px 0px';
    pet = createInitialPet();
    nav.home();
    idle();
    save();
    message('已開始新的旅程');
    return;
  }
  if (!motionTimeline(action, growthStage(pet)) && !timelineFor(action, growthStage(pet))) return;
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
  const newStage = growthStage(pet);
  const grew = newStage !== oldStage;
  Object.assign(nav, transaction.navigation);
  // Growth shows the celebration and switches only between the two approved age identities.
  if (grew) {
    nav.home();
    $('room-scene').classList.add('is-growing-up'); // Celebration only; character swaps art with no morph.
  }
  idle();
  const labels = {feed:'吃飽一點了',snack:'點心吃完了',drink:'喝完水了',toilet:'如廁完成',play:'玩得很開心',clean:'身體乾淨了',groom:'小臉洗好了',pet:'喜歡你的陪伴',stretch:'伸展完成',window:'看完窗外了'};
  message(grew ? `關係更近了 · ${pet.name} 長大了` : `${labels[transaction.action]}${pet.bond > previousBond ? ` · 關係 +${pet.bond - previousBond}` : ''}`);
  if (grew) celebrateGrowth(oldStage, newStage);
}

const STAGE_LABELS = { kitten: '幼年', growing: '成長中', adult: '成年' };
const GROWTH_CELEBRATION_MS = 4000;
let celebrationTimer;

function celebrateGrowth(from, to) {
  $('growth-path').textContent = `${STAGE_LABELS[from]} → ${STAGE_LABELS[to]}`;
  $('growth-celebration').hidden = false;
  clearTimeout(celebrationTimer);
  celebrationTimer = setTimeout(endCelebration, GROWTH_CELEBRATION_MS);
}

function endCelebration() {
  clearTimeout(celebrationTimer);
  $('growth-celebration').hidden = true;
  $('room-scene').classList.remove('is-growing-up');
  if (!busy && !sleeping && nav.screen === 'room') {
    playIdleFrames();
    scheduleIdle();
  }
}

function cancelAction() {
  const transaction = pendingAction;
  if (!transaction) return;
  pendingAction = null;
  const recovery = (motionTimeline(transaction.action, growthStage(pet)) || timelineFor(transaction.action, growthStage(pet))).slice(-2)
    .map(frame => ({ ...frame, caption: '收回動作', phase: 'recover', ms: 180 }));
  runMotion(transaction.action, () => {
    Object.assign(nav, transaction.navigation);
    idle();
    message('已取消 · 數值未變更');
  }, recovery);
}

function control(key) {
  // Any key closes the growth celebration early; that press does nothing else.
  if (!$('growth-celebration').hidden) {
    endCelebration();
    return;
  }
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
  stopAmbient();
  $('room-scene').dataset.action = 'idle';
  $('room-scene').dataset.phase = 'idle';
  $('room-scene').dataset.ambient = 'false';
  activeCaption = '';
  showFrame(0, '陪著你', 'idle');
  feedback = '';
  const action = nav.key(key);
  render();
  if (action) act(action);
  else if (nav.screen === 'room') {
    playIdleFrames();
    scheduleIdle();
  }
}

function acceptInput(key) {
  if (!debounced(key, performance.now())) return;
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
// One ambient task at a time. Walking and small idle poses alternate; care,
// menus, sleep and hidden tabs cannot leave a movement callback running.
function stopAmbient() {
  stopIdleFrames();
  cancelAnimationFrame(walkRequest);
  walkRequest = 0;
  clearTimeout(actionTimer);
  clearTimeout(idleTimer);
}

function walkAround() {
  stopIdleFrames();
  const plan = planWalk(roomX);
  const started = performance.now();
  const atlas = $('pet-atlas');
  $('room-scene').dataset.action = 'walk';
  $('room-scene').dataset.phase = 'action';
  $('room-scene').dataset.ambient = 'true';
  activeCaption = '散步中';
  refreshStatus();
  $('pet-facing').style.transform = `scaleX(${plan.direction})`;
  atlas.dataset.kind = 'walk';
  const walking = motionAsset('walk',growthStage(pet));
  atlas.style.backgroundImage = `url('${walking.src}')`;
  atlas.style.backgroundSize = `${walking.columns*100}% ${walking.rows*100}%`;
  atlas.style.clipPath = 'none';
  atlas.setAttribute('aria-label', `${pet.name} 散步中`);
  $('room-scene').setAttribute('aria-label', `${pet.name} 的像素房間；散步中`);
  const step = now => {
    const sample = walkSample(plan, now - started);
    const frame = Math.floor(Math.max(0,now-started)/(1000/walking.fps))%walking.frames;
    const pos = motionFramePosition(frame,walking);
    roomX = Math.round(sample.x);
    $('pet-visual').style.translate = `${roomX}px 0px`;
    atlas.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
    $('screen').dataset.frame = `walk-${frame}`;
    if (sample.done) {
      walkRequest = 0;
      $('room-scene').dataset.action = 'idle';
      $('room-scene').dataset.ambient = 'false';
      activeCaption = '';
      showFrame(0, '陪著你', 'idle');
      refreshStatus();
      playIdleFrames();
      scheduleIdle();
    } else walkRequest = requestAnimationFrame(step);
  };
  step(started);
}

function scheduleIdle() {
  clearTimeout(idleTimer);
  if (sleeping || busy || nav.screen !== 'room' || document.hidden) return;
  const { behavior, delay } = pickIdle(Math.random, lastAmbientId);
  idleTimer = setTimeout(() => {
    if (busy || sleeping || nav.screen !== 'room' || document.hidden ||
        !$('growth-celebration').hidden) return;
    if (walkNext && walkReady[growthStage(pet) === 'adult' ? 'adult' : 'kitten'] &&
        !reducedMotion.matches) {
      walkNext = false;
      walkAround();
      return;
    }
    walkNext = true;
    lastAmbientId = behavior.id;
    const ambientAction = {
      tail: 'tail_wag', lick: 'groom', look: 'curious', stretch: 'yawn',
    }[behavior.id] || 'tail_wag';
    const mood = pet.hygiene < 20 ? 'sick'
      : pet.hunger < 15 && pet.happiness < 40 ? 'angry'
      : pet.happiness < 20 ? 'sad'
      : pet.energy < 25 ? 'yawn'
      : pet.happiness >= 90 && behavior.id === 'tail' ? 'happy'
      : ambientAction;
    runMotion(mood, () => {
      $('room-scene').dataset.action = 'idle';
      $('room-scene').dataset.phase = 'idle';
      $('room-scene').dataset.ambient = 'false';
      activeCaption = '';
      showFrame(0, '陪著你', 'idle');
      refreshStatus();
      playIdleFrames();
      scheduleIdle();
    }, null, true);
  }, delay);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !busy && !sleeping) {
    stopAmbient();
    $('room-scene').dataset.action = 'idle';
    $('room-scene').dataset.ambient = 'false';
    showFrame(0, '陪著你', 'idle');
  }
  if (!document.hidden && !sleeping && !busy && nav.screen === 'room') {
    playIdleFrames();
    scheduleIdle();
  }
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && walkRequest) {
    stopAmbient();
    $('room-scene').dataset.action = 'idle';
    $('room-scene').dataset.ambient = 'false';
    showFrame(0, '陪著你', 'idle');
    playIdleFrames();
    scheduleIdle();
  }
});
setInterval(() => {
  const now = Date.now();
  const minutes = Math.floor((now - lastTick) / 60000);
  if (minutes > 0) {
    const wasAsleep = pet.sleeping;
    pet = tick(pet, minutes);
    lastTick += minutes * 60000;
    save();
    render();
    if (wasAsleep && !pet.sleeping) {
      pet = { ...pet, sleeping: true }; // Let wake() play the animation and persist the change.
      wake(wakeNote());
    }
  }
  refreshStatus();
  $('clock').textContent = new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}, 1000);
if (sleeping) sleepSettled(); else idle();
if (raw?.sleeping === true && !pet.sleeping) message(wakeNote()); // Woke up while the page was closed.
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
