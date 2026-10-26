import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const copy = JSON.parse(fs.readFileSync(new URL('../public/data/scout-i18n.json', import.meta.url), 'utf8'));
test('every scout locale covers public form, camera, moderation and API messages with matching placeholders', () => {
  assert.deepEqual(Object.keys(copy), ['en','de','ru','it','pl']);
  for (const [locale, groups] of Object.entries(copy)) {
    assert.deepEqual(Object.keys(groups), Object.keys(copy.en), locale);
    for (const [group, messages] of Object.entries(copy.en)) {
      assert.deepEqual(Object.keys(groups[group]), Object.keys(messages), `${locale}: ${group}`);
      for (const [key, english] of Object.entries(messages)) {
        const translated = groups[group][key];
        assert.ok(translated.trim(), `${locale}.${group}.${key}`);
        assert.deepEqual([...translated.matchAll(/\{\w+\}/g)].map(match=>match[0]).sort(), [...english.matchAll(/\{\w+\}/g)].map(match=>match[0]).sort(), `${locale}.${group}.${key}`);
      }
    }
  }
});
