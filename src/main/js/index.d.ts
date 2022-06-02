import * as semver from 'semver'

export * from 'zx'
export { semver }

interface $ {
  raw: $
  silent: $
}
