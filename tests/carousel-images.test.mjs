import assert from 'node:assert/strict';
import test from 'node:test';
import { observeCarouselImages } from '../app/carouselImages.ts';

test('loop copies stay deferred below the fold and load together before the carousel enters view', () => {
  const saved = globalThis.IntersectionObserver;
  const images = Array.from({ length: 15 }, () => ({ loading: 'lazy' }));
  const root = { querySelectorAll: selector => { assert.equal(selector, 'img[loading="lazy"]'); return images; } };
  let enter, disconnected = 0;
  globalThis.IntersectionObserver = class {
    constructor(callback, options) { enter = callback; assert.equal(options.rootMargin, '300px 0px'); }
    observe(target) { assert.equal(target, root); }
    disconnect() { disconnected++; }
  };
  try {
    const cleanup = observeCarouselImages(root);
    assert.ok(images.every(image => image.loading === 'lazy'));
    enter([{ isIntersecting: false }]);
    assert.ok(images.every(image => image.loading === 'lazy'));
    enter([{ isIntersecting: true }]);
    assert.ok(images.every(image => image.loading === 'eager'));
    assert.equal(disconnected, 1);
    cleanup();
    assert.equal(disconnected, 2);
  } finally { globalThis.IntersectionObserver = saved; }
});

test('browsers without IntersectionObserver still load every carousel image', () => {
  const saved = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = undefined;
  try {
    const images = [{ loading: 'lazy' }, { loading: 'lazy' }];
    assert.equal(observeCarouselImages(null), undefined);
    observeCarouselImages({ querySelectorAll: () => images });
    assert.ok(images.every(image => image.loading === 'eager'));
  } finally { globalThis.IntersectionObserver = saved; }
});
