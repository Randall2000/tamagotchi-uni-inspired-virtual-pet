import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, clamp, createInitialPet, GROWTH_BOND, growthStage, hydratePet, moodFor, tick, actionBlockReason, BOND_COOLDOWN_MS } from '../pet.js';

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
  let now = 1000;
  for (let i = 0; i < (GROWTH_BOND.growing - 2) / 2; i++) cared = applyAction(cared, 'pet', now += BOND_COOLDOWN_MS);
  assert.equal(cared.bond, GROWTH_BOND.growing - 2);
  assert.equal(growthStage(cared), 'kitten');
  const growing = applyAction(cared, 'pet', now += BOND_COOLDOWN_MS);
  assert.equal(growing.bond, GROWTH_BOND.growing);
  assert.equal(growthStage(growing), 'growing');
  cared = growing;
  for (let i = 0; i < (GROWTH_BOND.adult - GROWTH_BOND.growing - 2) / 2; i++) cared = applyAction(cared, 'pet', now += BOND_COOLDOWN_MS);
  assert.equal(cared.bond, GROWTH_BOND.adult - 2);
  assert.equal(growthStage(cared), 'growing');
  const adult = applyAction(cared, 'pet', now += BOND_COOLDOWN_MS);
  assert.equal(adult.bond, GROWTH_BOND.adult);
  assert.equal(growthStage(adult), 'adult');
  assert.equal(growthStage(tick(adult, 365 * 1440)), 'adult');
  assert.equal(growthStage(hydratePet(adult)), 'adult');
  // Legacy saves retain any growth already earned under the age-based rule.
  assert.equal(growthStage(hydratePet({ age: 8, ageMinutes: 0 })), 'adult');
  assert.equal(hydratePet({ age: 8, bond: 0 }).bond, 0);
});

test('growth is paced at 30/80 bond and one care action cannot jump a stage', () => {
  assert.deepEqual({ ...GROWTH_BOND }, { kitten: 0, growing: 30, adult: 80 });
  const nearlyGrowing = { ...createInitialPet(0), bond: GROWTH_BOND.growing - 3 };
  assert.equal(growthStage(applyAction(nearlyGrowing, 'pet', 0)), 'kitten');
  assert.equal(growthStage({ ...createInitialPet(0), bond: 12 }), 'kitten');
});

test('saves from the old 10/30 rule keep the stage they reached', () => {
  // v0.6 save: bond 12 was already growing, 30 was adult; no stageFloor field.
  assert.equal(growthStage(hydratePet({ bond: 12, age: 1 })), 'growing');
  assert.equal(growthStage(hydratePet({ bond: 30, age: 1 })), 'adult');
  assert.equal(growthStage(hydratePet({ bond: 5, age: 1 })), 'kitten');
  // Saves written by the new rule carry stageFloor and follow 30/80.
  const fresh = hydratePet(createInitialPet(0));
  assert.equal(fresh.stageFloor, 'kitten');
  assert.equal(growthStage(hydratePet({ ...createInitialPet(0), bond: 12 })), 'kitten');
  assert.equal(growthStage(hydratePet({ ...createInitialPet(0), bond: 12, stageFloor: 'bogus' })), 'growing');
  // A floor never shrinks even after more care.
  const legacyAdult = hydratePet({ bond: 30, age: 1 });
  assert.equal(growthStage(applyAction(legacyAdult, 'pet', 0)), 'adult');
});


test('relationship cooldown is shared across actions, persists on reload, and cannot reverse growth', () => {
  const first = applyAction(createInitialPet(1000), 'pet', 1000);
  assert.equal(first.bond, 2);
  const second = applyAction(first, 'feed', 1001);
  assert.equal(second.bond, 2);
  assert.equal(second.hunger, 90);
  const restored = hydratePet(second, 2000);
  assert.equal(applyAction(restored, 'clean', 2000).bond, 2);
  assert.equal(applyAction(restored, 'pet', 1000 + BOND_COOLDOWN_MS).bond, 4);
});

test('rejected actions do not award bond or change needs', () => {
  for (const [action, state] of [['feed',{hunger:100}],['snack',{happiness:100}],['play',{energy:7}],['clean',{hygiene:100}],['groom',{hygiene:100}],['pet',{sleeping:true}]]) {
    const pet = {...createInitialPet(),...state};
    assert.ok(actionBlockReason(pet,action));
    assert.equal(applyAction(pet,action),pet);
  }
});

test('minute-by-minute decay matches one elapsed batch; sleep restores energy', () => {
  const start = createInitialPet();
  let repeated = start;
  for(let i=0;i<10;i++) repeated=tick(repeated,1);
  assert.deepEqual(repeated,tick(start,10));
  const sleeping=applyAction({...start,energy:30},'rest');
  assert.equal(tick(sleeping,5).energy,58);
  assert.equal(hydratePet(sleeping).sleeping,true);
  assert.equal(tick(start,-100).hunger,start.hunger);
});
