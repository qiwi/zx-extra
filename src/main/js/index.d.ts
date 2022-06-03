import * as semver from 'semver'
import {ProcessPromise} from 'zx'
import * as ip from 'ip'
import * as tempy from 'tempy'

export * from 'zx'
export {
  ip,
  semver,
  tempy
}

interface $ {
  raw: $
  silent: $
  preferLocal?: boolean
  opt: (options: any) => $
}

export function createHook(opts?: $, name?: string, cb?: (p: ProcessPromise) => any, configurable?: boolean)
