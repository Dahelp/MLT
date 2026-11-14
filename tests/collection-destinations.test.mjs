import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
let destination = 'rome';
const cache = new Map();
function load(filename) {
  const file = path.resolve(filename);
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function('module', 'exports', 'require', code)(module, module.exports, spec => {
    if (spec === 'react') return { ...React, useState(initial) { return React.useState(initial === 'rome' ? destination : initial); } };
    if (spec === 'next/navigation') return { usePathname: () => '/en/collections/freedom/' };
    if (spec.endsWith('.css') || spec.startsWith('swiper/css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
    if (!spec.startsWith('.')) return require(spec);
    const base = path.resolve(path.dirname(file), spec);
    return load(fs.existsSync(base) ? base : fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
  });
  cache.set(file, module.exports);
  return module.exports;
}

const { collections } = load('content/mlt.ts');
const { collectionDestinations, collectionDestinationCopy } = load('content/collection-destinations.ts');
const { CollectionDetail } = load('app/collections/[slug]/CollectionDetail.tsx');
const MobileCollection = load('app/mobile-preview/MobileCollectionPreview.tsx').default;
const FreedomMobile = load('app/mobile-preview/freedom/FreedomMobilePreview.tsx').default;
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('all collection layouts show Rome booking and replace it with the localized city notice', () => {
  for (const locale of ['en', 'de', 'ru', 'it', 'pl']) for (const collection of collections.filter(item => item.id !== 'proposal')) {
    const layouts = [
      [CollectionDetail, { collection, initialLocale: locale }],
      collection.id === 'freedom'
        ? [FreedomMobile, { initialLocale: locale.toUpperCase(), previewMode: false }]
        : [MobileCollection, { collectionId: collection.id, initialLocale: locale, previewMode: false }],
    ];
    for (const [component, props] of layouts) {
      for (const city of collectionDestinations) {
        destination = city.id;
        const html = render(component, props);
        const select = html.match(/<select aria-label="[^"]+"[^>]*>(.*?)<\/select>/s)?.[1];
        assert.ok(select, `${collection.id}/${locale}: city selector`);
        assert.deepEqual([...select.matchAll(/value="([^"]+)"/g)].map(match => match[1]), ['rome', 'venice', 'milan', 'salzburg', 'munich']);
        assert.ok(select.includes(`value="${city.id}" selected=""`));
        if (city.id === 'rome') {
          assert.doesNotMatch(html, /collection-destination-notice/);
          assert.match(html, /departure-calendar-trigger/);
          assert.match(html, /booking-total|class="sticky"/);
        } else {
          assert.ok(html.includes(collectionDestinationCopy[locale].developing));
          assert.match(html, /role="status"/);
          assert.doesNotMatch(html, /departure-calendar-trigger|data-journey-costs|booking-total|booking-route-picker|class="sticky"|class="types"|class="package-switch/);
        }
      }
      destination = 'rome';
      assert.match(render(component, props), /departure-calendar-trigger/);
    }
  }
});
