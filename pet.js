export const MAX_STAT = 100;
export const GROWTH_BOND = Object.freeze({ kitten: 0, growing: 10, adult: 30 });
const BOND_GAINS = Object.freeze({ feed: 1, play: 2, clean: 1, pet: 2, groom: 1 });
export const BOND_COOLDOWN_MS = 60000;
export const INITIAL_PET = Object.freeze({
  name: 'MOMO', age: 1, ageMinutes: 0, bond: 0, hunger: 78, happiness: 72,
  hygiene: 80, energy: 88, coins: 12, lastSavedAt: 0, lastBondAt: null, sleeping: false,
});

export function clamp(value, min = 0, max = MAX_STAT) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? Math.min(max, Math.max(min, Math.round(numeric)))
    : min;
}

export function createInitialPet(now = Date.now()) {
  return { ...INITIAL_PET, lastSavedAt: now };
}

export function actionBlockReason(pet, action) {
  if (pet.sleeping) return '熟睡中 · B / C 喚醒';
  if (action === 'feed' && pet.hunger >= 100) return '已經吃飽了，晚點再吃';
  if (action === 'snack' && (pet.hunger >= 100 || pet.happiness >= 100)) return '現在不需要點心';
  if (action === 'play' && pet.energy < 8) return '有點累了 · 選單→休息';
  if (['clean', 'groom'].includes(action) && pet.hygiene >= 100) return '已經很乾淨了';
  return '';
}

export function applyAction(pet, action, now = Date.now()) {
  if (actionBlockReason(pet, action)) return pet;
  const next = { ...pet };
  const gain = BOND_GAINS[action] || 0;
  const eligible = pet.lastBondAt == null || now - pet.lastBondAt >= BOND_COOLDOWN_MS;
  if (gain && eligible) {
    next.bond = clamp((next.bond || 0) + gain);
    next.lastBondAt = now;
  }
  if (action === 'feed') {
    next.hunger = clamp(next.hunger + 12);
    next.energy = clamp(next.energy - 2);
  }
  if (action === 'snack') {
    next.hunger = clamp(next.hunger + 4);
    next.happiness = clamp(next.happiness + 6);
  }
  if (action === 'play') {
    next.happiness = clamp(next.happiness + 14);
    next.energy = clamp(next.energy - 8);
    next.hunger = clamp(next.hunger - 4);
  }
  if (action === 'clean') {
    next.hygiene = clamp(next.hygiene + 20);
    next.happiness = clamp(next.happiness + 1);
  }
  if (action === 'rest') {
    next.energy = clamp(next.energy + 18);
    next.hunger = clamp(next.hunger - 2);
    next.sleeping = true;
  }
  if (action === 'pet') {
    next.happiness = clamp(next.happiness + 8);
  }
  if (action === 'groom') next.hygiene = clamp(next.hygiene + 10);
  return next;
}

export function tick(pet, minutes = 1) {
  const elapsed = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const bounded = value => Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  const ageMinutes = (Number.isFinite(pet.ageMinutes) ? pet.ageMinutes : 0) + elapsed;
  return {
    ...pet,
    ageMinutes,
    age: Math.max(pet.age, Math.floor(ageMinutes / 1440) + 1),
    hunger: bounded(pet.hunger - elapsed * 0.4),
    happiness: bounded(pet.happiness - elapsed * 0.15),
    hygiene: bounded(pet.hygiene - elapsed * 0.12),
    energy: bounded(pet.energy + elapsed * (pet.sleeping ? 2 : -0.1)),
  };
}

export function growthStage(pet) {
  const bond = clamp(pet.bond || 0);
  if (bond < GROWTH_BOND.growing) return 'kitten';
  if (bond < GROWTH_BOND.adult) return 'growing';
  return 'adult';
}

export function moodFor(pet) {
  const score = (pet.hunger + pet.happiness + pet.hygiene + pet.energy) / 4;
  if (score >= 80) return { label: 'GLOWING', face: '✦' };
  if (score >= 55) return { label: 'COZY', face: '◡' };
  return { label: 'WOBBLY', face: '·ᴗ·' };
}

export function hydratePet(raw, now = Date.now()) {
  const base = createInitialPet(now);
  if (!raw || typeof raw !== 'object') return base;
  const restored = { ...base };
  for (const key of ['hunger', 'happiness', 'hygiene', 'energy']) {
    if (raw[key] !== undefined && raw[key] !== null) restored[key] = clamp(raw[key]);
  }
  restored.coins = Math.max(0, Math.floor(Number(raw.coins) || 0));
  if (Number.isFinite(raw.age) && raw.age >= 1) restored.age = Math.floor(raw.age);
  if (Number.isFinite(raw.ageMinutes) && raw.ageMinutes >= 0) {
    restored.ageMinutes = Math.floor(raw.ageMinutes);
    restored.age = Math.max(restored.age, Math.floor(restored.ageMinutes / 1440) + 1);
  } else if (restored.age > 1) {
    restored.ageMinutes = (restored.age - 1) * 1440;
  }
  if (Number.isFinite(raw.bond) && raw.bond >= 0) {
    restored.bond = clamp(raw.bond);
  } else {
    // Preserve the one-way growth reached by saves from the old age-based rule.
    restored.bond = restored.age >= 8
      ? GROWTH_BOND.adult
      : restored.age >= 4 ? GROWTH_BOND.growing : 0;
  }
  if (typeof raw.name === 'string' && raw.name.length <= 20) restored.name = raw.name;
  if (Number.isFinite(raw.lastSavedAt) && raw.lastSavedAt >= 0) restored.lastSavedAt = raw.lastSavedAt;
  if (Number.isFinite(raw.lastBondAt) && raw.lastBondAt >= 0) restored.lastBondAt = Math.min(raw.lastBondAt, now);
  restored.sleeping = raw.sleeping === true;
  return restored;
}

export function needsNotice(pet) {
  if (pet.sleeping) return '熟睡中 · B / C 喚醒';
  if (pet.hunger < 25) return '肚子餓了 · 食物→正餐';
  if (pet.energy < 15) return '想休息了 · 選單→休息';
  if (pet.hygiene < 25) return '想洗乾淨 · 清潔';
  if (pet.happiness < 25) return '想和你玩 · 玩耍 / 陪伴';
  return 'A 選擇 · B 確認';
}
