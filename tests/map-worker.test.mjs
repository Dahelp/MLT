import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('production map bundles and references a same-origin GeoJSON worker', async () => {
  const assets = new URL('../dist/client/assets/', import.meta.url);
  const files = await readdir(assets);
  const workers = files.filter(file => /^maplibre-gl-worker-[\w-]+\.js$/.test(file));
  assert.equal(workers.length, 1, 'GeoJSON lines require an emitted worker, not an inferred URL');
  const code = await readFile(new URL(workers[0], assets), 'utf8');
  assert.ok(code.length > 10000, 'The emitted asset must contain the worker implementation');
  assert.doesNotThrow(() => new vm.Script(code));
  const maps = files.filter(file => /^RealRouteMap-[\w-]+\.js$/.test(file));
  assert.ok(maps.length > 0);
  const bundles = await Promise.all(maps.map(file => readFile(new URL(file, assets), 'utf8')));
  assert.ok(bundles.some(code => code.includes(workers[0])), 'The client map must use the emitted worker URL');
});
