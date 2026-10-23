import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

function dependencyChain(entry, names) {
  let require = createRequire(import.meta.resolve(entry));
  let file;
  for (const name of names) {
    file = require.resolve(name);
    require = createRequire(file);
  }
  return { file, braces: require(file) };
}

const eslint = dependencyChain('eslint-config-next', ['@next/eslint-plugin-next', 'fast-glob', 'micromatch', 'braces']);
const vinext = dependencyChain('vinext', ['vite-plugin-commonjs', 'vite-plugin-dynamic-import', 'fast-glob', 'micromatch', 'braces']);
const braces = vinext.braces;
const isDepthError = error => error instanceof SyntaxError && error.message === 'braces: AST depth exceeds safety limit (128)';
const nested = (n, open = '{', close = '}') => open.repeat(n) + 'a,b' + close.repeat(n);

test('both affected dependency chains load the same patched braces package', () => {
  assert.equal(eslint.file, vinext.file);
  assert.throws(() => eslint.braces.parse(nested(128)), isDepthError);
});

test('ordinary build patterns retain their compile and expansion behavior', () => {
  assert.deepEqual(braces('src/{app,content}/**/*.{ts,tsx}'), ['src/(app|content)/**/*.(ts|tsx)']);
  assert.deepEqual(braces.expand('file-{01..03}.js'), ['file-01.js', 'file-02.js', 'file-03.js']);
  assert.deepEqual(braces.expand('a/{b,{c,d}}/e'), ['a/b/e', 'a/c/e', 'a/d/e']);
  assert.deepEqual(braces.expand('{a,a,b}', { nodupes: true }), ['a', 'b']);
  assert.deepEqual(braces.expand('{,a}', { noempty: true }), ['a']);
  assert.equal(braces.stringify(braces.parse('a/{b,c}/d')), 'a/{b,c}/d');
  assert.deepEqual(braces(['a/{b,c}', 'd/{1..2}'], { expand: true }), ['a/b', 'a/c', 'd/1', 'd/2']);
});

test('all public string APIs reject excessive braces, parentheses and mixed nesting', () => {
  const patterns = [nested(128), nested(4000), '{'.repeat(4000), nested(4000, '(', ')'), nested(100, '{(', ')}')];
  for (const pattern of patterns) {
    for (const fn of [braces, braces.create, braces.parse, braces.compile, braces.expand, braces.stringify]) {
      assert.throws(() => fn(pattern), isDepthError);
      assert.throws(() => fn(pattern, { maxDepth: Infinity, depthLimit: false, rangeLimit: false }), isDepthError);
    }
  }
});

test('nesting boundary is deterministic and literals are not mistaken for AST depth', () => {
  const boundary = nested(127);
  assert.doesNotThrow(() => braces.parse(boundary));
  for (const fn of [braces.compile, braces.expand, braces.stringify]) assert.doesNotThrow(() => fn(boundary));
  assert.doesNotThrow(() => braces.parse('"' + '{'.repeat(500) + '"'));
  assert.doesNotThrow(() => braces.parse('[' + '{'.repeat(500) + ']'));
  assert.doesNotThrow(() => braces.parse('\\{'.repeat(500)));
  assert.doesNotThrow(() => braces.compile('{a,b}'.repeat(100)), 'Wide, shallow patterns remain valid');
});

function ast(depth) {
  const root = { type: 'root', nodes: [] };
  let parent = root;
  for (let i = 0; i < depth; i++) {
    const child = { type: 'paren', nodes: [], parent };
    parent.nodes.push(child); parent = child;
  }
  parent.nodes.push({ type: 'text', value: 'x', parent });
  return root;
}

test('AST APIs cannot bypass the parser guard, including direct internal imports', () => {
  const require = createRequire(vinext.file);
  for (const fn of [braces.compile, braces.expand, braces.stringify, require('./lib/compile'), require('./lib/expand'), require('./lib/stringify')]) {
    assert.doesNotThrow(() => fn(ast(127)));
    assert.throws(() => fn(ast(4000)), isDepthError);
    const cycle = { type: 'root', nodes: [] }; cycle.nodes.push(cycle);
    assert.throws(() => fn(cycle), isDepthError);
  }
});

test('advisory payload is rejected without stack exhaustion in a small-stack subprocess', () => {
  const script = `
    const assert = require('node:assert/strict');
    const braces = require(${JSON.stringify(vinext.file)});
    const pattern = '{'.repeat(4000) + 'a,b' + '}'.repeat(4000);
    for (const method of ['parse', 'compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](pattern), e => e instanceof SyntaxError && e.message.includes('safety limit'));
    }
    assert.deepEqual(braces.expand('{a,b}'), ['a', 'b']);
  `;
  const result = spawnSync(process.execPath, ['--stack-size=256', '-e', script], { encoding: 'utf8', timeout: 5000, windowsHide: true });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.signal, null);
});
