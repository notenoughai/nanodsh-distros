import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const distrosRoot = fileURLToPath(new URL('../distros/', import.meta.url));

const PACKAGE_NAME = /^@nanodsh\/distro-[a-z0-9][a-z0-9-]*$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const DISTRO_API = 1;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry !== '');
}

export function readDistros(root = distrosRoot) {
  return readdirSync(root)
    .filter((entry) => statSync(join(root, entry)).isDirectory())
    .sort()
    .map((directory) => {
      const file = join(root, directory, 'package.json');
      return { directory, file, manifest: JSON.parse(readFileSync(file, 'utf8')) };
    });
}

export function validateDistro({ directory, manifest }) {
  const errors = [];
  if (!PACKAGE_NAME.test(manifest.name ?? '')) errors.push('name must match @nanodsh/distro-<slug>');
  if (manifest.name !== `@nanodsh/distro-${directory}`) errors.push(`name must be @nanodsh/distro-${directory}, the directory name`);
  if (!VERSION.test(manifest.version ?? '')) errors.push('version must be an exact semver, for example 0.0.1');
  if (manifest.private === true) errors.push('the package must be publishable, so private must not be true');
  if (!isPlainObject(manifest.dsh?.distro)) {
    errors.push('dsh.distro must be an object');
  } else {
    const distro = manifest.dsh.distro;
    if (distro.api !== DISTRO_API) errors.push(`dsh.distro.api must be ${DISTRO_API}`);
    if (!isStringArray(distro.defaultBundles)) errors.push('dsh.distro.defaultBundles must be a non-empty array of package names');
    if (distro.allowBuilds !== undefined && !isStringArray(distro.allowBuilds)) {
      errors.push('dsh.distro.allowBuilds must be a non-empty array of package names when present');
    }
  }
  const dependencies = manifest.dependencies;
  if (!isPlainObject(dependencies) || Object.keys(dependencies).length === 0) {
    errors.push('dependencies must carry the host packages');
  } else {
    for (const [name, spec] of Object.entries(dependencies)) {
      if (typeof spec !== 'string' || !VERSION.test(spec)) errors.push(`dependency ${name} must be pinned to an exact version`);
    }
    const base = dependencies['@deepseek-ai/dsh-base'];
    if (base !== undefined && manifest.version !== base) {
      errors.push(`version must match the @deepseek-ai/dsh-base dependency (${base})`);
    }
  }
  if (manifest.publishConfig?.access !== 'public') errors.push('publishConfig.access must be public');
  return errors;
}

export function validateAll(root = distrosRoot) {
  const distros = readDistros(root);
  const failures = [];
  if (distros.length === 0) failures.push({ directory: '.', errors: ['no distro packages were found'] });
  const versions = new Set();
  for (const distro of distros) {
    const errors = validateDistro(distro);
    if (errors.length > 0) failures.push({ directory: distro.directory, errors });
    if (typeof distro.manifest.version === 'string') versions.add(distro.manifest.version);
  }
  if (versions.size > 1) {
    failures.push({ directory: '.', errors: [`the packages must share one version, found ${[...versions].sort().join(', ')}`] });
  }
  return { distros, failures };
}
