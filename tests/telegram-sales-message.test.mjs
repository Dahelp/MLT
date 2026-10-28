import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const helper=fileURLToPath(new URL('../public/api/telegram-sales-message.php',import.meta.url));
const listing={id:1,type:'motorhome',slug:'mercedes-benz-v-300-marco-polo',title:'Mercedes-Benz V 300 Marco Polo',price:'44900.00',year:2019,mileage:106000};
const body={source:'listing_ID_1',subject:'Acquisition Inquiry: Mercedes-Benz V 300 Marco Polo',context:'Listing: Mercedes-Benz V 300 Marco Polo; Price: €44,900.',firstName:'Тестовый',lastName:'Клиент',email:'test@example.test',phone:'+390000000000',collection:'Tour-only collection',arrival:'2099-01-01',departure:'2099-01-10',route:['Tour-only route'],extras:['Tour-only activity']};
function format(payload,item=listing){
 return execFileSync('php',['-r',`require $argv[1]; $data=json_decode(stream_get_contents(STDIN),true); echo mlt_sales_telegram_message($data['body'],'MLT-TEST',$data['listing']);`,helper],{input:JSON.stringify({body:payload,listing:item}),encoding:'utf8'});
}

test('a vehicle lead contains sales details and customer text without any tour fields',()=>{
 const text=format({...body,notes:body.context+'\nМожно посмотреть автодом завтра?'});
 assert.match(text,/НОВАЯ ЗАЯВКА НА ПОКУПКУ АВТОДОМА/);
 for(const expected of ['Номер заявки: MLT-TEST','Объект: Mercedes-Benz V 300 Marco Polo','Цена: 44 900 €','Год: 2019','Пробег: 106 000 км','https://mlt-lifestyle.com/en/acquisitions/mercedes-benz-v-300-marco-polo/','Тестовый Клиент','test@example.test','+390000000000','Сообщение клиента:\nМожно посмотреть автодом завтра?'])assert.ok(text.includes(expected),expected);
 assert.doesNotMatch(text,/Collection:|Travel dates:|Travellers:|Duration:|Indicative rate:|Route:|Experiences:|Tour-only|2099|Listing:/);
});

test('current inventory supplies the price while a blank customer message is stated explicitly',()=>{
 const text=format({...body,context:'Old cached price: €1.',notes:'Old cached price: €1.',phone:''},{...listing,price:'43900.50'});
 assert.match(text,/Цена: 43 900,50 €/);
 assert.doesNotMatch(text,/€1|44 900/);
 assert.match(text,/Телефон: Не указан/);
 assert.match(text,/Сообщение клиента:\nБез дополнительного сообщения\./);
});

test('capsule homes and general acquisition requests have appropriate headings and no vehicle-only facts',()=>{
 const capsule=format({...body,notes:'Interested'},{...listing,type:'capsule',title:'Capsule Home',year:null});
 assert.match(capsule,/НОВАЯ ЗАЯВКА НА ПОКУПКУ КАПСУЛЬНОГО ДОМА/);
 assert.doesNotMatch(capsule,/Пробег:|Год:/);
 const general=format({...body,source:'acquisitions',subject:'Acquisition Request',context:'Please source a camper',notes:'Please source a camper\nBudget €40,000.'},null);
 assert.match(general,/НОВАЯ ЗАЯВКА НА ПОКУПКУ\n/);
 assert.match(general,/Детали запроса: Please source a camper/);
 assert.match(general,/Сообщение клиента:\nBudget €40,000\./);
 assert.doesNotMatch(general,/Цена:|undefined|null|Travel dates/);
});

test('only an exact form context prefix is removed from the customer message',()=>{
 const notes='Сначала мой вопрос.\n'+body.context+'\n<b>Текст клиента</b>';
 assert.ok(format({...body,notes}).includes(notes));
 const slug=format({...body,notes:'Test'},{...listing,slug:'vehicle?other=1'});
 assert.match(slug,/acquisitions\/vehicle%3Fother%3D1\//);
});
