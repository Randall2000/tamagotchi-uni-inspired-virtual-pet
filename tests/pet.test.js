import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, clamp, createInitialPet, GROWTH_BOND, growthStage, hydratePet, moodFor, tick } from '../pet.js';

test('initial state is playable and bounded', () => { const pet = createInitialPet(123); assert.equal(pet.lastSavedAt, 123); assert.ok(pet.hunger > 0 && pet.happiness > 0 && pet.energy > 0); });
test('care actions raise the permanent bond while rest does not', () => {
  const pet = createInitialPet();
  const fed = applyAction(pet, 'feed');
  const played = applyAction(pet, 'play');
  assert.equal(fed.hunger, pet.hunger + 12);
  assert.equal(fed.bond, 1);
  assert.equal(played.happiness, pet.happiness + 14);
  assert.equal(played.bond, 2);
  assert.equal(applyAction(pet, 'clean').bond, 1);
  assert.equal(applyAction(pet, 'groom').bond, 1);
  assert.equal(applyAction(pet, 'pet').bond, 2);
  assert.equal(applyAction(pet, 'rest').bond, 0);
  assert.equal(pet.coins, 12);
});
test('values never exceed the playable range', () => {
  assert.equal(clamp(140), 100);
  assert.equal(clamp(-4), 0);
  assert.equal(applyAction({ ...createInitialPet(), happiness: 99 }, 'play').happiness, 100);
  assert.equal(applyAction({ ...createInitialPet(), bond: 99 }, 'play').bond, 100);
});
test('time reduces care stats and mood is derived', () => { const pet = tick(createInitialPet(), 10); assert.ok(pet.hunger < 78); assert.equal(moodFor(createInitialPet()).label, 'COZY'); });
test('saved data is hydrated defensively', () => { const pet = hydratePet({ hunger: 999, energy: 'bad', coins: -3 }, 456); assert.equal(pet.hunger, 100); assert.equal(pet.energy, 0); assert.equal(pet.coins, 0); assert.equal(pet.lastSavedAt, 456); });
test('growth follows permanent bond and never reverses when needs decay', () => {
  const baby = createInitialPet(0);
  assert.equal(growthStage(baby), 'kitten');
  const older = tick(baby, 9 * 1440);
  assert.equal(older.age, 10);
  assert.equal(growthStage(older), 'kitten');
  let cared = older;
  for (let i = 0; i < 4; i++) cared = applyAction(cared, 'pet');
  assert.equal(cared.bond, GROWTH_BOND.growing - 2);
  assert.equal(growthStage(cared), 'kitten');
  const growing = applyAction(cared, 'pet');
  assert.equal(growing.bond, GROWTH_BOND.growing);
  assert.equal(growthStage(growing), 'growing');
  cared = growing;
  for (let i = 0; i < 9; i++) cared = applyAction(cared, 'pet');
  assert.equal(cared.bond, GROWTH_BOND.adult - 2);
  assert.equal(growthStage(cared), 'growing');
  const adult = applyAction(cared, 'pet');
  assert.equal(adult.bond, GROWTH_BOND.adult);
  assert.equal(growthStage(adult), 'adult');
  assert.equal(growthStage(tick(adult, 365 * 1440)), 'adult');
  assert.equal(growthStage(hydratePet(adult)), 'adult');
  // Legacy saves retain any growth already earned under the age-based rule.
  assert.equal(growthStage(hydratePet({ age: 8, ageMinutes: 0 })), 'adult');
  assert.equal(hydratePet({ age: 8, bond: 0 }).bond, 0);
});
