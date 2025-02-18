import {$ as _$, ProcessPromise, within, ProcessOutput, Options} from 'zx'
import childProcess from 'node:child_process'
import process from 'node:process'
import {isTemplateSignature, randomId} from './util.ts'
import {semver} from './goods.ts'

export * from 'zx'
export * from './goods.ts'

ProcessOutput.prototype.valueOf = function () {
  return this.toString()
}

ProcessOutput.prototype.toString = function () {
  const str = this.stdout.toString()
  return $.trim
    ? str.trim()
    : str
}

type Callback = (...args: any[]) => any

export function ctx <C extends Callback>(cb: C, ref = $): ReturnType<C> {
  return within<ReturnType<C>>(() => cb(ref))
}

type Zx = typeof _$
type Extra = {
  trim?:  boolean
  raw:    Zx
  silent: Zx
  o:      Zx
  opt:    Zx
}
type $Extra = Zx & Extra

export const $: $Extra = Object.assign(_$, {
  trim:     true,
  verbose:  process.env.VERBOSE === 'true',
  cwd:      process.cwd(),                // https://github.com/google/zx/blob/c73ccb468cfd2340fb296e17a543eb2399b449ec/src/core.ts#L174
  silent:   _$({quiet: true}),            // https://github.com/google/zx/pull/134
  raw:      _$({quote: v => v}),
  opt:      _$,
  o:        _$,
} as Extra)

type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never
type HookCallback = (this: HookProcess, p: HookProcess, ...args: any[]) => any
type HookOptions = Partial<Record<any, any> & Options>
interface HookProcess extends ProcessPromise {
  [k: string | number | symbol]: any
}

export function createHook <Callback extends HookCallback, O extends HookOptions>(opts: O, name: string, cb: Callback, configurable: false): (pieces: TemplateStringsArray | HookOptions, ...args: any) => ReturnType<Callback>
export function createHook <Callback extends HookCallback, O extends HookOptions>(opts: O, name: string, cb: Callback, configurable: true): (...args: DropFirst<Parameters<Callback>>) => (pieces: TemplateStringsArray | HookOptions, ...args: any) => ReturnType<Callback>
export function createHook <Callback extends HookCallback, O extends HookOptions>(opts: O, name = randomId(), cb?: Callback, configurable?: boolean) {
  (ProcessPromise.prototype as any)[name] = function (this: HookProcess, ...args: any[]): ReturnType<Callback> {
    Object.assign((this as any)._snapshot, opts)
    return cb ? cb.apply(this, [this, ...args]) : this
  }

  const getP = (p: HookProcess | unknown, opts: O, $args: Parameters<Zx>): HookProcess =>
    p instanceof ProcessPromise ? p : $(opts)(...$args)

  return (...args: Parameters<Zx>) => {
    if (!configurable) {
      const p = getP(args[0], opts, args)
      return p[name]()
    }

    if (isTemplateSignature(...args)) {
      throw new Error('Configurable hook requires options: use $.hook(a, b)`cmd --foo bar` instead of $.hook`cmd --foo bar`')
    }

    return (...$args: Parameters<Zx>) => {
      const p = getP($args[0], opts, $args)
      return p[name](...args)
    }
  }
}

const getBinVer = (bin: string, opt: string, nothrow?: boolean) => {
  try {
    const {stdout, stderr, error = stderr.toString('utf-8')} = childProcess.spawnSync(bin, [opt], {})
    if (error) {
      throw error
    }
    return stdout?.toString('utf-8').trim().split(' ').find(v => semver.valid(v))
  } catch (e) {
    if (nothrow) return

    throw e
  }
}

export const ver = (target: string, range = '*'): string => {
  const version = (() => {
    try {
      return require(`${target}/package.json`).version
    } catch (e) {
      const v = getBinVer(target, '--version', true) || getBinVer(target, '-v', true)
      if (v) return v

      throw new Error(`${target} not found`)
    }
  })()

  if (!semver.satisfies(version, range)) {
    throw new Error(`${target}@${version} does not satisfy ${range}`)
  }

  return version
}
