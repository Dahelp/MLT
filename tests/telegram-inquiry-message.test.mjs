import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const helper=fileURLToPath(new URL('../public/api/telegram-inquiry-message.php',import.meta.url));
const format=body=>execFileSync('php',['-r',`require $argv[1]; echo mlt_inquiry_telegram_message(json_decode(stream_get_contents(STDIN),true),'MLT-TEST');`,helper],{input:JSON.stringify(body),encoding:'utf8'});
const client={firstName:'Тестовый',lastName:'Клиент',email:'test@example.test',phone:'+390000000000'};

test('investment notifications include calculation and customer question without tour fields',()=>{
 const context='Investment Amount: €100000; Investment Term: 3 years; Annual Yield: €15000.';
 const text=format({...client,source:'investments',subject:'Investment Inquiry',context,notes:context+'\nНужен индивидуальный расчёт.',collection:'Private',arrival:'2099-01-01',route:['Tour-only route']});
 for(const value of ['НОВАЯ ЗАЯВКА НА ИНВЕСТИЦИИ','MLT-TEST','Тестовый Клиент',client.email,client.phone,context,'Сообщение клиента:\nНужен индивидуальный расчёт.','/sales/investments/'])assert.ok(text.includes(value),value);
 assert.equal(text.split(context).length,2);
 assert.doesNotMatch(text,/Коллекция:|Даты поездки:|Маршрут:|Private|2099|Tour-only/);
});

test('tour notifications preserve travel details and general contact requests omit empty fields',()=>{
 const text=format({...client,source:'concierge',collection:'Signature',vehicle:'KNAUS',country:'Italy',arrival:'2099-01-01',departure:'2099-01-08',guests:2,days:7,rate:'€300 / day',route:['Rome','Milan'],extras:['Dinner'],notes:'Пожелание'});
 for(const value of ['НОВАЯ ЗАЯВКА НА ТУР / КОНСЬЕРЖ','Коллекция: Signature','Автодом: KNAUS','Страна старта: Italy','Даты поездки: 2099-01-01 — 2099-01-08','Путешественники: 2','Количество дней: 7','€300 / day','Rome → Milan','Dinner','Пожелание','/concierge/'])assert.ok(text.includes(value),value);
 const contact=format({...client,source:'contact',notes:'Вопрос'});
 assert.doesNotMatch(contact,/Коллекция:|Даты поездки:|Количество дней:|undefined|null/);
});
