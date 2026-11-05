import test from 'node:test';
import assert from 'node:assert/strict';
import { Navigation, menus, quickActions, makeDebouncer } from '../navigation.js';

test('care shortcuts run on B directly without an option layer', () => {
  const n = new Navigation();
  assert.deepEqual(quickActions.slice(0, 4).map(item => item.action), ['feed', 'clean', 'play', 'pet']);
  assert.equal(n.key('b'), 'feed');
  assert.equal(n.screen, 'room');
  n.key('a');
  assert.equal(n.key('b'), 'clean');
  n.key('a');
  assert.equal(n.key('b'), 'play');
  n.key('a');
  assert.equal(n.key('b'), 'pet');
  assert.equal(n.screen, 'room');
  assert.equal(n.quickCursor, 3);
});

test('menu is one level: every entry except settings is an action', () => {
  for (const item of menus.main) {
    if (item.label === '設定') assert.equal(item.menu, 'settings');
    else assert.ok(item.action && !item.menu && !item.screen, item.label);
  }
  assert.deepEqual(menus.main.map(item => item.label), ['睡覺', '點心', '洗臉', '伸懶腰', '看窗外', '設定']);
  assert.deepEqual(Object.keys(menus), ['main', 'settings']);
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

test('full menu is controlled by A/B/C only, preserving selection on returning from settings', () => {
  const n = new Navigation();
  n.enter('main');
  for (let i = 0; i < menus.main.length; i++) n.key('a');
  assert.equal(n.cursor, 0);
  assert.equal(n.key('b'), 'rest');
  n.key('a');
  assert.equal(n.key('b'), 'snack');
  for (let i = 0; i < 4; i++) n.key('a');
  assert.equal(n.key('b'), null);
  assert.equal(n.screen, 'settings');
  assert.equal(n.key('c'), null);
  assert.equal(n.screen, 'main');
  assert.equal(n.cursor, 5);
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

test('debounce only swallows a repeat of the same key, never a different key', () => {
  const accept = makeDebouncer(120);
  assert.equal(accept('a', 0), true);
  assert.equal(accept('a', 60), false);
  assert.equal(accept('b', 60), true);
  assert.equal(accept('c', 70), true);
  assert.equal(accept('a', 130), true);
  assert.equal(accept('b', 150), false);
  assert.equal(accept('b', 181), true);
});
