import test from 'node:test';
import assert from 'node:assert/strict';
import { Navigation, menus } from '../navigation.js';

test('A / B opens shallow menu and runs common care in two presses', () => {
  const n = new Navigation();
  assert.equal(n.key('a'), null);
  assert.equal(n.screen, 'main');
  assert.equal(n.key('b'), 'feed');
  assert.equal(n.screen, 'room');
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'main');
});

test('A moves through menu, wraps, and C returns to same parent cursor', () => {
  const n = new Navigation();
  n.key('a');
  for (let i = 0; i < menus.main.length; i++) n.key('a');
  assert.equal(n.cursor, 0);
  n.choose(4);
  assert.equal(n.screen, 'interact');
  n.key('a');
  n.key('c');
  assert.equal(n.screen, 'main');
  assert.equal(n.cursor, 4);
  n.key('c');
  assert.equal(n.screen, 'room');
});

test('click and B share exactly one selection / action', () => {
  const n = new Navigation();
  n.enter('main');
  assert.equal(n.choose(2), 'clean');
  assert.equal(n.screen, 'room');
  n.enter('main');
  n.key('a');
  assert.equal(n.key('b'), 'play');
  assert.equal(n.screen, 'room');
});

test('reset defaults to preserving progress, requiring explicit second selection', () => {
  const n = new Navigation();
  n.enter('settings');
  n.key('a');
  n.key('b');
  assert.equal(n.screen, 'confirm');
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'settings');
  n.key('b');
  n.key('a');
  assert.equal(n.key('b'), 'reset');
  assert.equal(n.screen, 'room');
});

test('invalid direct item selection never causes action or navigation', () => {
  const n = new Navigation();
  n.enter('main');
  assert.equal(n.choose(100), null);
  assert.equal(n.choose(-1), null);
  assert.equal(n.choose(NaN), null);
  assert.equal(n.screen, 'main');
});
