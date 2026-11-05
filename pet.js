export const MAX_STAT = 100;
export const GROWTH_DAYS = Object.freeze({ kitten: 1, growing: 4, adult: 8 });
export const INITIAL_PET = Object.freeze({
  name: 'MOMO', age: 1, ageMinutes: 0, hunger: 78, happiness: 72,
  hygiene: 80, energy: 88, coins: 12, lastSavedAt: 0,
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

export function applyAction(pet, action) {
  const next = { ...pet };
  if (action === 'feed') {
    next.hunger = clamp(next.hunger + 12);
    next.energy = clamp(next.energy - 2);
    next.coins += 1; // Existing prototype economy; will be reconciled with Rust core.
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
  }
  if (action === 'pet') {
    next.happiness = clamp(next.happiness + 8);
  }
  return next;
}

export function tick(pet, minutes = 1) {
  const elapsed = Math.max(0, Math.floor(minutes));
  const ageMinutes = (Number.isFinite(pet.ageMinutes) ? pet.ageMinutes : 0) + elapsed;
  return {
    ...pet,
    ageMinutes,
    age: Math.max(pet.age, Math.floor(ageMinutes / 1440) + 1),
    hunger: clamp(pet.hunger - elapsed * 0.4),
    happiness: clamp(pet.happiness - elapsed * 0.15),
    hygiene: clamp(pet.hygiene - elapsed * 0.12),
    energy: clamp(pet.energy - elapsed * 0.1),
  };
}

export function growthStage(pet) {
  if (pet.age < GROWTH_DAYS.growing) return 'kitten';
  if (pet.age < GROWTH_DAYS.adult) return 'growing';
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
  if (typeof raw.name === 'string' && raw.name.length <= 20) restored.name = raw.name;
  if (Number.isFinite(raw.lastSavedAt) && raw.lastSavedAt >= 0) restored.lastSavedAt = raw.lastSavedAt;
  return restored;
}
