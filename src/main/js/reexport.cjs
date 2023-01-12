const { execSync } = require('node:child_process')
const { join } = require('node:path')

const reexport = (name) => require(join(
  execSync('npm list -g --depth=0 --parseable npm', {shell: true}).toString().trim(),
  'node_modules',
  name
))

const semver = reexport('semver')
const SSRI = reexport('ssri')
const INI = reexport('ini')

module.exports = {
  semver,
  SSRI,
  INI,
}
