import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, cp, mkdir, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { randomUUID, randomBytes } from 'node:crypto';

test('Scout Passport: private moderation, valid portraits, retry safety, revision and map publication', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mlt-scout-'));
  const apiDirectory = path.join(directory, 'api'); await mkdir(apiDirectory);
  await mkdir(path.join(directory, 'data'));
  await cp(new URL('../public/data/scout-i18n.json', import.meta.url), path.join(directory, 'data/scout-i18n.json'));
  for (const file of ['scout.php', 'scout-core.php', 'security.php']) await cp(new URL(`../public/api/${file}`, import.meta.url), path.join(apiDirectory, file));
  await cp(new URL('./scout-test-booking.php', import.meta.url), path.join(apiDirectory, 'booking.php'));
  const php = process.env.PHP_BINARY || 'php';
  const image = (width, height) => 'data:image/jpeg;base64,' + execFileSync(php, ['-r', `$im=imagecreatetruecolor(${width},${height});ob_start();imagejpeg($im);echo base64_encode(ob_get_clean());`], { encoding: 'utf8' }).trim();
  const portrait = image(300, 400), landscape = image(400, 300);
  const port = await new Promise(resolve => { const server = createServer(); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
  const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', directory], { stdio: ['ignore', 'ignore', 'pipe'] });
  let log = ''; server.stderr.on('data', chunk => { log += chunk; });
  const request = async (body, role, locale = "ru") => {
    const response = await fetch(`http://127.0.0.1:${port}/api/scout.php`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MLT-Locale': locale, ...(role ? { Authorization: `Bearer test-${role}-token` } : {}) }, body: JSON.stringify(body) });
    const raw = await response.text();
    try { return { status: response.status, data: JSON.parse(raw) }; } catch { throw Error(raw + log); }
  };
  const fields = { action: 'submit', requestId: randomUUID(), editToken: randomBytes(32).toString('hex'), scoutName: 'Local test scout', category: 'sight', title: '<img src=x onerror=alert(1)> Test place', country: 'Italy', latitude: '0', longitude: '-180', description: 'A real local test description', parking: 'Parking 150 m', booking: 'Two days ahead', photos: [portrait, portrait] };
  try {
    for (let index = 0; index < 50; index++) { try { await request({ action: 'points' }); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); } }
    for (const role of [undefined, 'manager', 'concierge', 'salesmanager', 'traveller']) {
      for (const action of ['list', 'moderate', 'publish', 'unpublish', 'revision_link']) assert.equal((await request({ action }, role)).status, 403, `${role}: ${action}`);
    }
    for (const invalid of [{ latitude: '' }, { longitude: 181 }, { category: 'invalid' }, { photos: [portrait] }, { photos: [portrait, landscape] }, { photos: [portrait, 'data:image/svg+xml;base64,PHN2Zy8+'] }, { website: 'bot' }]) assert.equal((await request({ ...fields, ...invalid })).status, 400);
    const messages = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../public/data/scout-i18n.json', import.meta.url), 'utf8'));
    for (const locale of ['en','de','ru','it','pl']) {
      const forbidden = await request({action:'list'}, undefined, locale);
      assert.equal(forbidden.status,403); assert.equal(forbidden.data.code,'adminRequired');
      assert.equal(forbidden.data.error,messages[locale].errors.adminRequired);
    }
    let submitted = await request(fields); assert.equal(submitted.status, 200, JSON.stringify(submitted.data));
    let card = submitted.data.card;
    assert.equal(card.status, 'pending'); assert.equal(card.isPublished, false); assert.equal(card.photos.length, 2);
    assert.equal(card.latitude, '0'); assert.equal(card.longitude, '-180');
    assert.equal((await request(fields)).data.card.reference, card.reference, 'A lost-response retry must not create another card');
    assert.equal((await request({ ...fields, editToken: 'a'.repeat(64) })).status, 404, 'Request ID alone cannot retrieve a card');
    assert.equal((await request({ action: 'points' })).data.points.length, 0);
    const list = (await request({ action: 'list' }, 'admin')).data;
    assert.equal(list.total, 1); assert.equal(list.counts.pending, 1); assert.ok(!JSON.stringify(list).includes('edit_token_hash'));
    assert.equal((await request({ action: 'read', reference: card.reference, editToken: 'b'.repeat(64) })).status, 404);
    assert.equal((await request({ action: 'read', reference: card.reference, editToken: fields.editToken })).data.card.reference, card.reference);
    const command = async (action, extra = {}) => {
      const result = await request({ action, reference: card.reference, version: card.version, ...extra }, 'admin');
      assert.equal(result.status, 200, JSON.stringify(result.data)); card = result.data.card; return result.data;
    };
    assert.equal((await request({ action: 'publish', reference: card.reference, version: card.version }, 'admin')).status, 409);
    await command('moderate', { status: 'accepted' });
    assert.equal((await request({ action: 'points' })).data.points.length, 0, 'Approval does not publish automatically');
    await command('publish'); const pointId = card.publishedPointId; assert.ok(pointId); assert.equal(card.isPublished, true);
    let points = (await request({ action: 'points' })).data.points; assert.equal(points.length, 1); assert.equal(points[0].title, fields.title);
    for (const privateField of ['scout_name', 'scoutName', 'editToken', 'edit_token_hash', 'review_note', 'request_id']) assert.ok(!JSON.stringify(points).includes(privateField));
    await command('unpublish'); assert.equal(card.isPublished, false); assert.equal((await request({ action: 'points' })).data.points.length, 0);
    await command('publish'); assert.equal(card.publishedPointId, pointId); assert.equal((await request({ action: 'points' })).data.points.length, 1);
    assert.equal((await request({ action: 'moderate', reference: card.reference, version: card.version - 1, status: 'rejected' }, 'admin')).status, 409, 'Stale reviewers cannot overwrite newer decisions');
    assert.equal((await request({ action: 'moderate', reference: card.reference, version: card.version, status: 'revision' }, 'admin')).status, 400);
    await command('moderate', { status: 'revision', reviewNote: 'Please add an entrance photo' });
    assert.equal((await request({ action: 'points' })).data.points.length, 0, 'Returning a published card to revision removes it from maps');
    const { editToken } = await command('revision_link');
    assert.equal((await request({ action: 'read', reference: card.reference, editToken: fields.editToken })).status, 404, 'A regenerated capability revokes the old link');
    const revise = { ...fields, action: 'resubmit', reference: card.reference, version: card.version, requestId: randomUUID(), editToken, title: 'Updated location', photos: card.photos };
    assert.equal((await request({ ...revise, photos: [card.photos[0], '/uploads/scout/someone-elses.jpg'] })).status, 400);
    const revised = await request(revise); assert.equal(revised.status, 200, JSON.stringify(revised.data)); card = revised.data.card;
    assert.equal(card.status, 'pending'); assert.equal(card.title, 'Updated location');
    assert.equal((await request(revise)).data.card.version, card.version, 'Revision retries are idempotent');
    assert.equal((await request({ ...revise, requestId: randomUUID() })).status, 409, 'A scout cannot edit while awaiting moderation');
    await command('moderate', { status: 'accepted' }); await command('publish');
    points = (await request({ action: 'points' })).data.points;
    assert.equal(points.length, 1); assert.equal(points[0].title, 'Updated location'); assert.equal(card.publishedPointId, pointId);
    await command('moderate', { status: 'rejected', reviewNote: 'Not suitable' }); assert.equal((await request({ action: 'points' })).data.points.length, 0);
    assert.equal((await request({ action: 'list', search: 'Updated location', status: 'rejected' }, 'admin')).data.total, 1);
    assert.equal((await readdir(path.join(directory, 'uploads/scout'))).length, 2, 'Validation and retries must not leak duplicate image files');
    const get = await fetch(`http://127.0.0.1:${port}/api/scout.php?action=list`); assert.equal(get.status, 405);
  } finally {
    server.kill(); await new Promise(resolve => server.once('exit', resolve));
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('mlt-scout-'));
    await rm(directory, { recursive: true, force: true });
  }
});
