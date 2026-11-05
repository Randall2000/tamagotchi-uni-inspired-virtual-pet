import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('device screen contains no clickable buttons, including menus and shortcuts', () => {
  const screenMarkup = html.slice(html.indexOf('<div class="screen"'), html.indexOf('<section class="controls"'));
  assert.doesNotMatch(screenMarkup, /<button\b/i);
  assert.equal((screenMarkup.match(/data-quick="/g) || []).length, 6);
  assert.equal((html.match(/data-control="/g) || []).length, 3);
});

test('screen is explicitly non-touch and only the external controls receive click handlers', () => {
  assert.match(css, /\.screen\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(app, /querySelectorAll\('\[data-control\]'\)/);
  assert.doesNotMatch(app, /querySelectorAll\('\[data-quick\]'\)\.forEach/);
  assert.doesNotMatch(app, /getElementById\('open-menu'\)/);
});

test('instructions explicitly explain A/B/C controls and non-touch operation', () => {
  assert.match(html, /螢幕不支援觸控/);
  assert.match(html, /A 選功能、B 確認、C 返回/);
});
