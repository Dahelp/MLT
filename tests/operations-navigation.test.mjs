import assert from 'node:assert/strict';
import test from 'node:test';
import {operationsNavigation} from '../content/operations-navigation.ts';

test('admin navigation has one fixed order with overview first and vouchers after payments', () => {
  const expected = ['overview','applications','payments','vouchers','catalog','sales','investments','users','base-location','team','chat'];
  for (const locale of ['ru','en','de']) {
    const links = operationsNavigation('admin', locale);
    assert.deepEqual(links.map(link => link.key), expected);
    assert.equal(new Set(links.map(link => link.href)).size, expected.length);
    assert.equal(links.find(link => link.key === 'sales').href, '/admin/acquisitions/');
    assert.equal(links.find(link => link.key === 'vouchers').href, '/admin/vouchers/');
    assert.ok(links.every(link => link.label && link.href.startsWith('/admin/')));
  }
  const ru = operationsNavigation('admin','ru');
  assert.equal(ru.find(link => link.key === 'sales').label, 'Продажи');
  assert.equal(ru.find(link => link.key === 'chat').label, 'Чат');
});

test('other workspaces keep their own destinations and the shared voucher destination', () => {
  for (const scope of ['manager','sales','concierge']) {
    const links = operationsNavigation(scope,'ru');
    assert.equal(links.filter(link => link.key === 'vouchers').length, 1);
    assert.ok(links.every(link => link.key === 'vouchers' || link.href.startsWith(`/${scope}/`)));
    assert.equal(links.at(-1).key, scope === 'manager' ? 'vouchers' : 'chat');
  }
});
