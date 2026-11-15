import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateAll, validateDistro } from '../scripts/manifest.mjs';

function manifest(overrides = {}) {
  return {
    name: '@nanodsh/distro-standard',
    version: '0.0.1',
    dsh: { distro: { api: 1, defaultBundles: ['@deepseek-ai/dsh-base'], allowBuilds: ['node-pty'] } },
    dependencies: { '@deepseek-ai/dsh-base': '0.2.2-rc.1' },
    publishConfig: { access: 'public' },
    ...overrides
  };
}

function errors(overrides) {
  return validateDistro({ directory: 'distro-standard', manifest: manifest(overrides) });
}

function repository(distros) {
  const root = mkdtempSync(join(tmpdir(), 'distros-'));
  for (const [directory, value] of Object.entries(distros)) {
    mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(join(root, directory, 'package.json'), `${JSON.stringify(value, null, 2)}\n`);
  }
  return root;
}

test('every distro in the repository is valid', () => {
  assert.deepEqual(validateAll().failures, []);
});

test('accepts a manifest that follows the rules', () => {
  assert.deepEqual(errors({}), []);
});

test('rejects a name outside the @nanodsh/distro- scope', () => {
  assert.match(errors({ name: '@other/distro-standard' }).join('\n'), /@nanodsh\/distro-/);
});

test('rejects a name that does not match its directory', () => {
  assert.match(errors({ name: '@nanodsh/distro-other' }).join('\n'), /directory name/);
});

test('rejects a dependency that is not pinned exactly', () => {
  assert.match(errors({ dependencies: { '@deepseek-ai/dsh-base': '^0.2.2-rc.1' } }).join('\n'), /exact version/);
});

test('rejects an api the launcher does not speak', () => {
  assert.match(errors({ dsh: { distro: { api: 2, defaultBundles: ['@deepseek-ai/dsh-base'] } } }).join('\n'), /api must be 1/);
});

test('rejects a distro without default bundles', () => {
  assert.match(errors({ dsh: { distro: { api: 1 } } }).join('\n'), /defaultBundles/);
});

test('rejects a package that is private', () => {
  assert.match(errors({ private: true }).join('\n'), /private must not be true/);
});

test('rejects a package that would publish as restricted', () => {
  assert.match(errors({ publishConfig: { access: 'restricted' } }).join('\n'), /publishConfig.access/);
});

test('rejects packages that drift apart in version', () => {
  const root = repository({
    'distro-standard': manifest(),
    'distro-other': manifest({ name: '@nanodsh/distro-other', version: '0.0.2' })
  });
  const { failures } = validateAll(root);
  assert.match(failures.flatMap((failure) => failure.errors).join('\n'), /share one version/);
});

test('rejects a repository with no packages', () => {
  const root = mkdtempSync(join(tmpdir(), 'distros-empty-'));
  assert.match(validateAll(root).failures.flatMap((failure) => failure.errors).join('\n'), /no distro packages/);
});
