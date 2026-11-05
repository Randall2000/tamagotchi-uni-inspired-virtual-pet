export const MAX_STAT = 100;
export const INITIAL_PET = Object.freeze({ name: 'MOMO', age: 1, hunger: 78, happiness: 72, energy: 88, coins: 12, lastSavedAt: 0 });

export function clamp(value, min = 0, max = MAX_STAT) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : min;
}

export function createInitialPet(now = Date.now()) {
  return { ...INITIAL_PET, lastSavedAt: now };
}

export function applyAction(pet, action) {
  const next = { ...pet };
  if (action === 'feed') { next.hunger = clamp(next.hunger + 12); next.energy = clamp(next.energy - 2); next.coins += 1; }
  if (action === 'play') { next.happiness = clamp(next.happiness + 14); next.energy = clamp(next.energy - 8); next.hunger = clamp(next.hunger - 4); }
  if (action === 'rest') { next.energy = clamp(next.energy + 18); next.hunger = clamp(next.hunger - 2); }
  return next;
}

export function tick(pet, minutes = 1) {
  const elapsed = Math.max(0, Math.floor(minutes));
  return { ...pet, hunger: clamp(pet.hunger - elapsed * 0.4), happiness: clamp(pet.happiness - elapsed * 0.15), energy: clamp(pet.energy - elapsed * 0.1) };
}

export function moodFor(pet) {
  const score = (pet.hunger + pet.happiness + pet.energy) / 3;
  if (score >= 80) return { label: 'GLOWING', face: '✦' };
  if (score >= 55) return { label: 'COZY', face: '◡' };
  return { label: 'WOBBLY', face: '·ᴗ·' };
}

export function hydratePet(raw, now = Date.now()) {
  const base = createInitialPet(now);
  if (!raw || typeof raw !== 'object') return base;
  return { ...base, ...raw, hunger: clamp(raw.hunger), happiness: clamp(raw.happiness), energy: clamp(raw.energy), coins: Math.max(0, Number(raw.coins) || 0) };
}
