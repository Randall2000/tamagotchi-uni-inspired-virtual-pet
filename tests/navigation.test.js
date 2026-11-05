import test from 'node:test';
import assert from 'node:assert/strict';
import { Navigation, menus, quickActions } from '../navigation.js';

test('food opens a preview and action selection retains its return location', () => {
  const n = new Navigation();
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'food');
  assert.equal(n.key('b'), 'feed');
  assert.equal(n.screen, 'food');
  n.key('a');
  assert.equal(n.key('b'), 'snack');
  assert.equal(n.cursor, 1);
  n.key('c');
  assert.equal(n.screen, 'room');
  assert.equal(n.quickCursor, 0);
});

test('A cycles through all six non-touch screen shortcuts and wraps to first', () => {
  const n = new Navigation();
  assert.equal(quickActions.length, 6);
  for (let i = 0; i < quickActions.length; i++) n.key('a');
  assert.equal(n.quickCursor, 0);
  assert.equal(n.key('c'), null);
  assert.equal(n.screen, 'room');
});

test('B on selected menu icon enters full menu; C returns with shortcut focus retained', () => {
  const n = new Navigation();
  for (let i = 0; i < 5; i++) n.key('a');
  assert.equal(n.quickCursor, 5);
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'main');
  assert.equal(n.cursor, 0);
  n.key('c');
  assert.equal(n.screen, 'room');
  assert.equal(n.quickCursor, 5);
});

test('full menu is controlled by A/B/C only, preserving selection on returning from submenu', () => {
  const n = new Navigation();
  n.enter('main');
  for (let i = 0; i < menus.main.length; i++) n.key('a');
  assert.equal(n.cursor, 0);
  n.key('a');
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'interact');
  n.key('a');
  assert.equal(n.key('c'), null);
  assert.equal(n.screen, 'main');
  assert.equal(n.cursor, 1);
  n.key('c');
  assert.equal(n.screen, 'room');
});

test('status is view-only: B cannot activate an invisible control, C returns to room', () => {
  const n = new Navigation();
  for (let i = 0; i < 4; i++) n.key('a');
  n.key('b');
  assert.equal(n.screen, 'status');
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'status');
  n.key('c');
  assert.equal(n.screen, 'room');
  assert.equal(n.quickCursor, 4);
});

test('reset requires explicit second selection; default B preserves progress', () => {
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
  assert.equal(n.screen, 'confirm');
});

test('invalid keys never trigger a care action', () => {
  const n = new Navigation();
  assert.equal(n.key('click'), null);
  assert.equal(n.key('tap'), null);
  assert.equal(n.key('enter'), null);
  assert.equal(n.quickCursor, 0);
  assert.equal(n.screen, 'room');
});
