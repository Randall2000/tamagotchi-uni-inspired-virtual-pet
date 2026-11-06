import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicPath } from '../server.mjs';

test('local server serves the web app and assets', () => {
  for (const url of ['/', '/index.html', '/app.js', '/roaming.js', '/styles.css', '/assets/momo-room.png', '/public/assets/momo-room.png?v=1']) {
    assert.ok(resolvePublicPath(url), url);
  }
});

test('local server never exposes secrets, git data or project files', () => {
  for (const url of ['/.env.local', '/.git/config', '/package.json', '/server.mjs', '/.vercel/project.json',
    '/assets/../../.env.local', '/public/assets/../../.env.local', '/%2e%2e/.env.local', '/docs/RELEASE_0.6.md']) {
    assert.equal(resolvePublicPath(url), null, url);
  }
});
