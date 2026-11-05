import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, clamp, createInitialPet, growthStage, hydratePet, moodFor, tick } from '../pet.js';

test('initial state is playable and bounded', () => { const pet = createInitialPet(123); assert.equal(pet.lastSavedAt, 123); assert.ok(pet.hunger > 0 && pet.happiness > 0 && pet.energy > 0); });
test('actions update only expected care stats', () => { const pet = createInitialPet(); const fed = applyAction(pet, 'feed'); const played = applyAction(pet, 'play'); assert.equal(fed.hunger, pet.hunger + 12); assert.equal(played.happiness, pet.happiness + 14); assert.equal(pet.coins, 12); });
test('values never exceed the playable range', () => { assert.equal(clamp(140), 100); assert.equal(clamp(-4), 0); assert.equal(applyAction({ ...createInitialPet(), happiness: 99 }, 'play').happiness, 100); });
test('time reduces care stats and mood is derived', () => { const pet = tick(createInitialPet(), 10); assert.ok(pet.hunger < 78); assert.equal(moodFor(createInitialPet()).label, 'COZY'); });
test('saved data is hydrated defensively', () => { const pet = hydratePet({ hunger: 999, energy: 'bad', coins: -3 }, 456); assert.equal(pet.hunger, 100); assert.equal(pet.energy, 0); assert.equal(pet.coins, 0); assert.equal(pet.lastSavedAt, 456); });
test('growth advances by saved play time and never reverses after hydration', () => {
  const baby = createInitialPet(0);
  assert.equal(growthStage(baby), 'kitten');
  const growing = tick(baby, 3 * 1440);
  assert.equal(growing.age, 4);
  assert.equal(growthStage(growing), 'growing');
  const adult = tick(growing, 4 * 1440);
  assert.equal(adult.age, 8);
  assert.equal(growthStage(adult), 'adult');
  assert.equal(hydratePet({ age: 8, ageMinutes: 0 }).age, 8);
});
