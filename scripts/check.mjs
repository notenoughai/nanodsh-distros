import { validateAll } from './manifest.mjs';

const { distros, failures } = validateAll();

for (const { directory, manifest } of distros) {
  process.stdout.write(`${directory} ${manifest.name}@${manifest.version}\n`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    for (const error of failure.errors) process.stderr.write(`${failure.directory}: ${error}\n`);
  }
  process.exitCode = 1;
}
