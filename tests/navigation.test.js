import test from 'node:test';
import assert from 'node:assert/strict';
import { Navigation, menus } from '../navigation.js';
test('three keys traverse categories, return to parent cursor and wrap', () => {
  const n = new Navigation(); n.key('a');
  for (let i = 0; i < menus.main.length; i++) n.key('a');
  assert.equal(n.cursor, 0); n.key('a'); n.key('b');
  assert.equal(n.screen, 'interact'); n.key('a'); n.key('c');
  assert.equal(n.screen, 'main'); assert.equal(n.cursor, 1);
  n.key('c'); assert.equal(n.screen, 'room');
});
test('reset defaults to preserve; only explicit selection resets', () => {
  const n = new Navigation(); n.enter('settings'); n.key('a'); n.key('b');
  assert.equal(n.screen, 'confirm'); assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'settings'); n.key('b'); n.key('a');
  assert.equal(n.key('b'), 'reset'); assert.equal(n.screen, 'room');
});
test('confirm emits one command then returns home; repeated B opens menu only', () => {
  const n = new Navigation(); n.key('a'); n.key('b');
  assert.equal(n.key('b'), 'feed'); assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'main');
});
