import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
const require = createRequire(import.meta.url)

const reexport = (name) => require(join(
  execSync('npm list -g --depth=0 --parseable npm', {shell: true}).toString().trim(),
  'node_modules',
  name
))

export const semver = reexport('semver')
export const SSRI = reexport('ssri')
