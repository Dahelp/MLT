import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

test('API rejects cross-site requests, malformed input, oversized bodies and password guessing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mlt-security-'));
  await cp(new URL('../public/api/security.php', import.meta.url), path.join(dir, 'security.php'));
  await writeFile(path.join(dir, 'account.php'), "<?php require __DIR__.'/security.php'; mlt_security_guard(); header('Content-Type: application/json'); echo '{}';");
  await writeFile(path.join(dir, 'webhook.php'), "<?php require __DIR__.'/security.php'; mlt_security_guard(['POST'], true); header('Content-Type: application/json'); echo '{}';");
  const port = await new Promise(resolve => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const server = spawn(process.env.PHP_BINARY || 'php', ['-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' });
  const request = (body = '{}', headers = {}, endpoint = 'account.php', method = 'POST') => fetch(`http://127.0.0.1:${port}/${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(method === 'POST' ? { body } : {}) });
  try {
    for (let i = 0; i < 50; i++) { try { await request(); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    assert.equal((await request()).status, 200);
    assert.equal((await request('{}', {}, 'account.php', 'GET')).status, 405);
    assert.equal((await request('{}', { 'Content-Type': 'text/plain' })).status, 415);
    for (const body of ['[]', 'null', '"text"', '{bad', '{"nested":' + '['.repeat(40) + '0' + ']'.repeat(40) + '}']) assert.equal((await request(body)).status, 400);
    assert.equal((await request('{}', { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await request('{}', { Origin: 'null' })).status, 403);
    assert.equal((await request('{}', { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
    assert.equal((await request('{}', { Origin: 'https://mlt-lifestyle.com' })).status, 200);
    assert.equal((await request('{}', { Origin: 'https://evil.example' }, 'webhook.php')).status, 200, 'Webhook remains usable by server-to-server delivery');
    assert.equal((await request(JSON.stringify({ text: 'x'.repeat(128 * 1024) }))).status, 413);
    for (let i = 0; i < 30; i++) assert.equal((await request(JSON.stringify({ action: 'login', email: 'victim@example.test' }))).status, 200);
    const blocked = await request(JSON.stringify({ action: 'login', email: 'other@example.test' }), { 'X-Forwarded-For': '203.0.113.8' });
    assert.equal(blocked.status, 429, 'Spoofed proxy headers cannot bypass the IP limit');
    assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
    assert.equal(blocked.headers.get('Cache-Control'), 'no-store, max-age=0');
    assert.equal(blocked.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(blocked.headers.get('Referrer-Policy'), 'no-referrer');
  } finally {
    server.kill(); await new Promise(resolve => server.once('exit', resolve));
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(tmpdir()));
    assert.ok(path.basename(dir).startsWith('mlt-security-'));
    await rm(dir, { recursive: true, force: true });
  }
});
