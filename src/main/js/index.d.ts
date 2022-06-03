import * as semver from 'semver'
import {ProcessPromise} from 'zx'

export * from 'zx'
export { semver }

interface $ {
  raw: $
  silent: $
  preferLocal?: boolean
  opt: (options: any) => $
}

export function createHook(opts?: $, name?: string, cb?: (p: ProcessPromise) => any, configurable?: boolean)
