import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { get as httpGet } from 'node:http';

const binary = process.env.APACHE_BINARY || 'C:/xampp82/apache/bin/httpd.exe';
test('Apache applies security headers and blocks private files and executable uploads', { skip: !existsSync(binary) }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'mlt-apache-security-'));
  const web = path.join(dir, 'web'); await mkdir(path.join(web, 'uploads'), { recursive: true });
  await cp(new URL('../public/.htaccess', import.meta.url), path.join(web, '.htaccess'));
  await cp(new URL('../public/uploads/.htaccess', import.meta.url), path.join(web, 'uploads/.htaccess'));
  for (const file of ['page.html', 'endpoint.php', '.env', 'backup.sql', 'paypal-config.php', 'uploads/test.php', 'uploads/photo.webp']) await writeFile(path.join(web, file), 'fixture');
  await mkdir(path.join(web, '.well-known/acme-challenge'), { recursive: true });
  await writeFile(path.join(web, '.well-known/acme-challenge/test'), 'challenge');
  const port = await new Promise(resolve => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const unix = value => value.replaceAll('\\', '/');
  const root = unix(path.resolve(path.dirname(binary), '..'));
  const config = path.join(dir, 'httpd.conf');
  await writeFile(config, `ServerRoot "${root}"
Listen 127.0.0.1:${port}
ServerName localhost
PidFile "${unix(path.join(dir, 'httpd.pid'))}"
ErrorLog "${unix(path.join(dir, 'error.log'))}"
${['authz_core', 'authz_host', 'rewrite', 'headers', 'mime'].map(m => `LoadModule ${m}_module modules/mod_${m}.so`).join('\n')}
TypesConfig conf/mime.types
DocumentRoot "${unix(web)}"
<Directory "${unix(web)}">
  AllowOverride All
  Require all granted
</Directory>
`);
  const server = spawn(binary, ['-f', config, '-X'], { stdio: 'ignore', windowsHide: true });
  const get = (p, headers = {}) => fetch(`http://127.0.0.1:${port}${p}`, { headers, redirect: 'manual' });
  try {
    for (let i = 0; i < 80; i++) { try { await get('/page.html'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const page = await get('/page.html'); assert.equal(page.status, 200);
    assert.equal(page.headers.get('X-Frame-Options'), 'SAMEORIGIN');
    assert.equal(page.headers.get('Referrer-Policy'), 'strict-origin', 'Map tiles receive the origin without leaking page paths or parameters');
    assert.equal((await get('/endpoint.php')).headers.get('Referrer-Policy'), 'no-referrer', 'API and payment callbacks retain stricter privacy');
    assert.ok(page.headers.get('Content-Security-Policy').includes("object-src 'none'"));
    for (const p of ['/.env', '/backup.sql', '/paypal-config.php', '/uploads/test.php']) assert.equal((await get(p)).status, 403, p);
    assert.equal((await get('/uploads/photo.webp')).status, 200);
    assert.equal((await get('/.well-known/acme-challenge/test')).status, 200);
    const redirect = await new Promise((resolve, reject) => {
      httpGet(`http://127.0.0.1:${port}/page.html`, { headers: { Host: 'mlt-lifestyle.com' } }, response => { response.resume(); resolve(response); }).on('error', reject);
    });
    assert.equal(redirect.statusCode, 308); assert.equal(redirect.headers.location, 'https://mlt-lifestyle.com/page.html');
  } finally {
    server.kill(); await new Promise(resolve => server.once('exit', resolve));
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(tmpdir()));
    assert.ok(path.basename(dir).startsWith('mlt-apache-security-'));
    await rm(dir, { recursive: true, force: true });
  }
});
