import assert from 'node:assert/strict';
import test from 'node:test';
import {operationsDestination} from '../content/operations-access.ts';
test('administrator retains own login when entering any operations panel',()=>{
 for(const next of ['/admin/team/','/manager/','/manager/chat/?conversation=4','/concierge/overview/','/concierge/chat/','/sales/acquisitions/'])assert.equal(operationsDestination('admin',next),next);
});
test('staff cannot use the login destination to enter another role panel',()=>{
 assert.equal(operationsDestination('manager','/admin/overview/'),'/manager/');
 assert.equal(operationsDestination('concierge','/manager/chat/'),'/concierge/overview/');
 assert.equal(operationsDestination('manager','/manager/chat/'),'/manager/chat/');
 assert.equal(operationsDestination('salesmanager','/manager/chat/'),'/manager/chat/');
 for(const next of ['https://example.com/','//example.com/','/manager-evil/'])assert.equal(operationsDestination('manager',next),'/manager/');
});
