import * as semver from 'semver'
import { ProcessPromise, Shell, Options } from 'zx'
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

type Executor = Shell & Options & {
  raw: Executor
  silent: Executor
  preferLocal?: boolean
  opt: (options: any) => Executor
  o: (options: any) => Executor
}

export declare const $: Executor

export function createHook(opts?: Executor, name?: string, cb?: (p: ProcessPromise) => any, configurable?: boolean)
