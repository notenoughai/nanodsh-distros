import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { distrosRoot, readDistros, validateAll } from './manifest.mjs';

const { failures } = validateAll();
if (failures.length > 0) {
  for (const failure of failures) {
    for (const error of failure.errors) process.stderr.write(`${failure.directory}: ${error}\n`);
  }
  process.exit(1);
}

for (const { directory, manifest } of readDistros()) {
  const destination = mkdtempSync(join(tmpdir(), 'distro-pack-'));
  execFileSync('pnpm', ['pack', '--pack-destination', destination], { cwd: join(distrosRoot, directory), stdio: 'pipe' });
  const tarballs = readdirSync(destination).filter((entry) => entry.endsWith('.tgz'));
  if (tarballs.length !== 1) throw new Error(`${directory}: expected one tarball, found ${tarballs.length}`);
  const tarball = join(destination, tarballs[0]);
  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n').sort();
  if (entries.length !== 1 || entries[0] !== 'package/package.json') {
    throw new Error(`${directory}: the tarball must carry package.json alone, found ${entries.join(', ')}`);
  }
  const packed = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }));
  if (packed.name !== manifest.name || packed.version !== manifest.version) {
    throw new Error(`${directory}: the tarball is ${packed.name}@${packed.version}, the repository is ${manifest.name}@${manifest.version}`);
  }
  if (packed.publishConfig?.access !== 'public') throw new Error(`${directory}: the tarball must publish as public`);
  process.stdout.write(`${tarballs[0]}\n`);
}
