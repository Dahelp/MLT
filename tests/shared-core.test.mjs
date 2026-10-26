import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

// Exercise the real pure TypeScript domain modules without the browser/runtime.
const root = fileURLToPath(new URL("../", import.meta.url));
const modules = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  const module = { exports: {} };
  modules.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const require = specifier => {
    assert.ok(specifier.startsWith("."), `Pure domain code must not need ${specifier}`);
    const target = path.resolve(path.dirname(filename), specifier);
    return load(path.extname(target) ? target : `${target}.ts`);
  };
  new Function("require", "module", "exports", source)(require, module, module.exports);
  return module.exports;
}
const pricing = load("content/journey-pricing.ts");
const products = load("content/collection-products.ts");
const home = load("content/home.ts");
const site = load("content/site.ts");

test("approved tariffs stay fixed; other collections retain catalog pricing", () => {
  for (const input of [undefined, "broken json", "null", "[]", '{"pricing":[null,{}, {"days":0,"price":99}]}']) {
    assert.deepEqual(pricing.resolveJourneyRates("signature", input), pricing.journeyRates.signature);
  }
  const data = JSON.stringify({ pricing: [{ days: 12, price: 4500 }, { days: 5, price: 1800 }, { days: 12, price: 4600 }, { days: 4, price: -1 }] });
  assert.deepEqual(pricing.resolveJourneyRates("honeymoon", data), [{ d: 5, p: 1800 }, { d: 12, p: 4600 }]);
  assert.deepEqual(pricing.resolveJourneyRates("honeymoon", '{"pricing":{"12":2500}}'), [{ d: 12, p: 2500 }]);
  assert.equal(pricing.journeyPrice("freedom", 10, 1990, true), 2340);
  assert.equal(pricing.journeyPrice("freedom", 12, 2500, true), 2800);
  assert.equal(pricing.journeyPrice("signature", 14, 5890, true), 5890);
  assert.equal(pricing.journeyTotal(2340, 4), 2720);
});

test("both home layouts use catalog duration and price labels in every language", () => {
  const catalog = [{ item_type: "collection", slug: "freedom", is_active: 1, data_json: '{"pricing":[{"days":5,"price":1200},{"days":12,"price":2500}]}' }];
  for (const locale of site.siteLocales) {
    const cards = home.homeCollectionCards(locale, catalog);
    assert.equal(cards.length, 5);
    assert.match(cards[0].rate, /1[,. \u00a0\u202f]?490/);
    assert.match(cards[0].days, /7–30/);
  }
  assert.equal(home.homeCollectionCards("en")[0].rate, "From €1,490 for 7 days");
});

test("desktop and mobile resolve identical ordered, active, localized products", () => {
  const catalog = [
    { item_type: "product", collection_id: "freedom", slug: "late", title: "Late", sort_order: 8, is_active: 1, data_json: '{"description_ru":"Описание"}' },
    { item_type: "product", collection_id: "freedom", slug: "hidden", title: "Hidden", sort_order: 0, is_active: 0 },
    { item_type: "product", collection_id: "freedom", slug: "first", title: "First", sort_order: 1, is_active: 1, data_json: "invalid" },
    { item_type: "product", collection_id: "private", slug: "other", title: "Other", is_active: 1 },
  ];
  const main = products.collectionProducts("freedom", "ru", catalog);
  const mobile = products.mobileCollectionProducts("freedom", "ru", catalog);
  assert.deepEqual(main.map(item => item.id), ["first", "late"]);
  assert.deepEqual(main.map(item => item.name), mobile.map(item => item.title));
  assert.deepEqual(main.map(item => item.description), mobile.map(item => item.copy.ru));
  assert.equal(main[1].description, "Описание");
  for (const id of ["freedom", "signature", "concierge", "private", "honeymoon"]) {
    assert.equal(products.collectionProducts(id, "en", []).length, 7);
  }
});

test("language switching retains route, preview mode, query and fragment", () => {
  assert.equal(site.localizedUrl("https://mlt-lifestyle.com/en/collections/freedom/mobile-preview/?x=1#map", "ru"), "https://mlt-lifestyle.com/ru/collections/freedom/mobile-preview/?x=1#map");
  assert.equal(site.localizedUrl("https://mlt-lifestyle.com/account/", "de"), "https://mlt-lifestyle.com/de/account/");
});

test("every fallback route has a translated description in every supported language", () => {
  for (const id of ["freedom", "signature", "concierge", "private", "honeymoon"]) {
    const english = products.collectionProducts(id, "en", []);
    for (const locale of ["de", "ru", "it", "pl"]) {
      const localized = products.collectionProducts(id, locale, []);
      localized.forEach((route, index) => {
        assert.ok(route.description.trim(), `${id}/${route.id}/${locale}`);
        assert.notEqual(route.description, english[index].description, `${id}/${route.id}/${locale} must not silently fall back to English`);
      });
    }
  }
});

test("all map points have valid shared coordinates", () => {
  const { mapPoints } = load("content/mlt.ts");
  const { mapCoordinates } = load("content/map.ts");
  for (const point of mapPoints) {
    const coordinates = mapCoordinates[point.id];
    assert.ok(coordinates && coordinates.length === 2, point.id);
    assert.ok(coordinates.every(Number.isFinite), point.id);
    assert.ok(Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90, point.id);
  }
});

test("PHP and React consume the same fallback tariffs and retain legacy payment durations", t => {
  let result;
  try {
    result = execFileSync("php", ["-r", "require 'public/api/journey-pricing.php'; echo json_encode(['base'=>mlt_journey_rate_tables(),'payment'=>mlt_journey_rate_tables(true)]);"], { cwd: root, encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") return t.skip("PHP is unavailable on this host");
    throw error;
  }
  const php = JSON.parse(result);
  for (const [id, rates] of Object.entries(pricing.journeyRates)) {
    assert.deepEqual(php.base[id], Object.fromEntries(rates.map(row => [row.d, row.p])));
  }
  assert.equal(php.payment.private[30], 85286);
  assert.equal(php.base.private[30], undefined);
});

test("voucher discounts retain the configured fractional percentage",()=>{const {voucherDiscount}=load("content/vouchers.ts");assert.equal(voucherDiscount(500000,400000),20);assert.equal(voucherDiscount(500000,407500),18.5);assert.equal(voucherDiscount(500000,500000),0);assert.equal(voucherDiscount(0,400000),0)});

test("voucher captions reflect the selected denomination in every language",()=>{const {voucherOfferCaption}=load("content/vouchers.ts");for(const locale of ["en","ru","de","it","pl"]){const caption=voucherOfferCaption(400000,300000,locale);assert.match(caption,/3[,. \u00a0\u202f]?000/);assert.match(caption,/4[,. \u00a0\u202f]?000/);assert.doesNotMatch(caption,/5[,. \u00a0\u202f]?000/);}});

test("voucher navigation only belongs to home, voucher and collection routes",()=>{const {showsVoucherNavigation}=load("content/site.ts");for(const locale of ['en','ru','de','it','pl']){for(const suffix of ['', 'vouchers/', 'collections/freedom/','mobile-site/','mobile-preview/signature/'])assert.equal(showsVoucherNavigation(`/${locale}/${suffix}`),true);for(const suffix of ['investments/','acquisitions/','contact/','smart-map/','account/','legal/terms/'])assert.equal(showsVoucherNavigation(`/${locale}/${suffix}`),false);}});
test("investment translations cover every phrase and localize year counts",()=>{const {investmentTranslations,investmentYears}=load('content/investment-i18n.ts');const keys=Object.keys(investmentTranslations.ru);for(const locale of ['de','it','pl'])assert.deepEqual(Object.keys(investmentTranslations[locale]),keys);assert.equal(investmentYears(1,'ru'),'1 год');assert.equal(investmentYears(3,'ru'),'3 года');assert.equal(investmentYears(5,'ru'),'5 лет');});

test('standard protection terms use all five languages while custom agreed conditions stay unchanged',()=>{
 const {defaultProtectionTerms,localizeProtectionTerms}=load('content/journey-copy.ts');
 const expected={en:'cancellation',ru:'отмену поездки',de:'Stornierung',it:'cancellazione',pl:'anulowania podróży'};
 for(const [locale,word] of Object.entries(expected)){
  const text=localizeProtectionTerms(defaultProtectionTerms,locale);assert.ok(text.includes(word),locale);assert.ok(text.includes('MLT'));
  assert.equal(localizeProtectionTerms('Individually approved terms: 12 days, 45%.',locale),'Individually approved terms: 12 days, 45%.');
 }
 assert.equal(localizeProtectionTerms(defaultProtectionTerms.replaceAll(' ', '\n'), 'ru'),localizeProtectionTerms(defaultProtectionTerms,'ru'));
 assert.ok(fs.readFileSync(path.join(root,'public/api/journey-terms.php'),'utf8').includes(defaultProtectionTerms));
});
