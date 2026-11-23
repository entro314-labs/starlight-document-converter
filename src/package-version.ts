import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Reads this package's version from its package.json.
 *
 * The manifest sits one directory above both `src/` and the bundled `dist/`, so the same
 * relative path resolves when running from source and from the published build.
 */
function readPackageVersion(): string {
  const manifestPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json')
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'))

  if (
    typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest &&
    typeof manifest.version === 'string'
  ) {
    return manifest.version
  }

  throw new Error(`${manifestPath} does not declare a version`)
}

export const packageVersion = readPackageVersion()
