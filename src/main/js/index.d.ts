import * as semver from 'semver'
import {ProcessPromise} from 'zx'
import * as ip from 'ip'
import * as tempy from 'tempy'
import * as tcping from 'is-reachable'

export * from 'zx'
export {
  ip,
  semver,
  tempy,
  tcping
}

interface $ {
  raw: $
  silent: $
  preferLocal?: boolean
  opt: (options: any) => $
}

export function createHook(opts?: $, name?: string, cb?: (p: ProcessPromise) => any, configurable?: boolean)
