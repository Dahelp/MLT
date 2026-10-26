import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {operationsBootstrapScript} from '../app/operationsBootstrap.ts';

function bootstrap(pathname, values = {}, blocked = false) {
  const dataset = {};
  vm.runInNewContext(operationsBootstrapScript, {
    location: {pathname}, document: {documentElement: {dataset}},
    localStorage: {getItem(key) {if (blocked) throw new Error('Storage unavailable'); return values[key] || null}},
  });
  return dataset;
}

test('operations preferences are applied before paint on every staff route', () => {
  for (const scope of ['admin','concierge','manager','sales']) {
    for (const locale of ['en','de','ru']) {
      assert.deepEqual(bootstrap(`/${scope}/catalog/`, {'mlt-operations-locale':locale,'mlt-operations-collapsed':'true'}), {operationsLocale:locale,operationsCollapsed:'true'});
    }
  }
});

test('bootstrap has safe defaults and leaves public pages alone', () => {
  assert.deepEqual(bootstrap('/admin/'), {operationsLocale:'en',operationsCollapsed:'false'});
  assert.deepEqual(bootstrap('/admin/', {'mlt-operations-locale':'invalid'}), {operationsLocale:'en',operationsCollapsed:'false'});
  assert.deepEqual(bootstrap('/admin/', {}, true), {});
  for (const path of ['/ru/','/en/acquisitions/','/administrator/','/sales-copy/']) assert.deepEqual(bootstrap(path, {'mlt-operations-locale':'ru'}), {});
});
