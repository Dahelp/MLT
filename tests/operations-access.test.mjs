import assert from 'node:assert/strict';
import test from 'node:test';
import {operationsDestination,adminReturnRequired} from '../content/operations-access.ts';
test('administrator retains own login when entering any operations panel',()=>{
 for(const next of ['/admin/team/','/manager/','/manager/chat/?conversation=4','/sales/','/sales/chat/','/sales/investments/','/concierge/overview/','/concierge/chat/','/sales/acquisitions/'])assert.equal(operationsDestination('admin',next),next);
});
test('staff cannot use the login destination to enter another role panel',()=>{
 assert.equal(operationsDestination('manager','/admin/overview/'),'/manager/chat/');
 assert.equal(operationsDestination('concierge','/manager/chat/'),'/concierge/overview/');
 assert.equal(operationsDestination('manager','/manager/chat/'),'/manager/chat/');
 assert.equal(operationsDestination('salesmanager','/manager/chat/'),'/sales/');
 for(const next of ['https://example.com/','//example.com/','/manager-evil/'])assert.equal(operationsDestination('manager',next),'/manager/chat/');
});

test("admin return appears only in other role workspaces",()=>{
 for(const path of ["/admin/overview/","/admin/chat/","/admin/users/","/admin/acquisitions/","/admin/team/","/en/","/manager-evil/"])assert.equal(adminReturnRequired("admin",path),false);
 for(const path of ["/manager/","/manager/chat/","/concierge/overview/","/sales/acquisitions/"]){assert.equal(adminReturnRequired("admin",path),true);for(const role of ["manager","concierge",undefined])assert.equal(adminReturnRequired(role,path),false)}
});

test('tourism managers have only chat; sales managers have their own complete workspace',()=>{
 for(const next of ['/manager/catalog/','/sales/','/sales/chat/','/sales/investments/','/admin/users/'])assert.equal(operationsDestination('manager',next),'/manager/chat/');
 for(const next of ['/sales/','/sales/catalog/','/sales/chat/','/sales/acquisitions/','/sales/investments/'])assert.equal(operationsDestination('salesmanager',next),next);
 assert.equal(operationsDestination('salesmanager'),'/sales/');assert.equal(operationsDestination('manager'),'/manager/chat/');
});
