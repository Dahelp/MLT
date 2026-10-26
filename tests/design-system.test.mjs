import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const globals = read('app/globals.css');
test('public typography and adjacent section rhythm share one responsive scale', () => {
  for (const declaration of ['--mlt-section-padding: 32px','--mlt-section-gap: 64px','--mlt-section-padding: 24px','--mlt-section-gap: 48px','--mlt-text-body: 18px','--mlt-text-body: 16px']) assert.ok(globals.includes(declaration), declaration);
});
test('base public sections cannot reintroduce independent numeric section padding', () => {
  const contracts = {
    'app/scout-passport/scout.css': ['.scout-section', '.scout-intro', '.scout-submit'],
    'app/vouchers.css': ['.voucher-section', '.voucher-conditions'],
    'app/commercial.css': ['.commercial-section', '.listing-information', '.commercial .listing-information', '.commercial .listing-equipment,.commercial .listing-source', '.commercial .listing-source', '.listing-detail', '.market-categories', '.market-results', '.mlt-info-body', '.mlt-contact-action'],
    'app/globals.css': ['.intro, .fleet, .collections, .designer, .contact', '.detail-intro', '.detail-flow', '.light-philosophy', '.light-collections', '.light-experiences', '.light-contact', '.collection-products'],
    'app/mobile-preview/home-preview.module.css': ['.section'],
    'app/mobile-preview/freedom/preview.module.css': ['.ideal,.shapes'],
  };
  for (const [file, selectors] of Object.entries(contracts)) {
    const rules = [...read(file).matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    for (const selector of selectors) {
      const matches = rules.filter(match => match[1].trim() === selector);
      assert.ok(matches.length, `${file}: missing ${selector}`);
      for (const match of matches) {
        for (const [, property, value] of match[2].matchAll(/(?:^|;)\s*(padding(?:-top|-bottom)?):\s*([^;]+)/g)) {
          assert.ok(value.trim() === '0' || value.includes('var(--mlt-section-padding)'), `${file}: ${selector} ${property}: ${value}`);
        }
      }
    }
  }
});
