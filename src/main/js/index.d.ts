import * as semver from 'semver'
import { ProcessPromise, Shell, Options as BasicOptions } from 'zx'
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

type Extra = {
  raw: Executor
  silent: Executor
  preferLocal?: boolean
  opt: (options: any) => Executor
  o: (options: any) => Executor
}

type Executor = Shell & BasicOptions & Extra

declare module 'zx' {
  export type Options = BasicOptions & Extra
}

export function createHook(opts?: Executor, name?: string, cb?: (p: ProcessPromise) => any, configurable?: boolean)
