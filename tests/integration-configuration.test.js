import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const app = readFileSync(new URL('app.js', root), 'utf8');
const ci = readFileSync(new URL('.github/workflows/ci.yml', root), 'utf8');
const html = readFileSync(new URL('index.html', root), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

test('published version and Web artifact both include the motion runtime', () => {
  assert.match(html, new RegExp('data-version="' + pkg.version.replaceAll('.', '\\.') + '"'));
  assert.match(ci, /index\.html app\.js motion\.js motion-pack\.js roaming\.js/);
  assert.match(app, /import \{ motionAsset, motionFramePosition, motionTimeline \} from '\.\/motion-pack\.js'/);
});

test('all character returns to idle explicitly select the new motion asset', () => {
  assert.doesNotMatch(app, /showFrame\(0\);/);
  assert.match(app, /showFrame\(0, '陪著你', 'idle'\)/);
  assert.match(app, /walkReady = \{ adult: false, kitten: false \}/);
  assert.match(app, /for \(const stage of \['adult', 'kitten'\]\)/);
});
