import {$, quiet, ProcessPromise} from 'zx'
import {ctx} from 'zx/experimental'

export { semver } from './semver.mjs'
export * from 'zx'

$.raw = async (...args) => {
  const q = $.quote
  $.quote = v => v
  try {
    return $(...args)
  } finally {
    $.quote = q
  }
}

$.silent = async (...args) => {
  // https://github.com/google/zx/pull/134
  return quiet($(...args))
}

$.o = $.opt =
  (opts) =>
    (...args) =>
      ctx(($) => Object.assign($, opts)(...args))

const randomId = () => Math.random().toString(36).slice(2)

export const createHook = (opts, name = randomId(), cb = (v) => v, configurable) => {
  ProcessPromise.prototype[name] = function (...args) {
    Object.assign(this.ctx, opts)
    return cb(this, ...args)
  }

  const getP = (p, opts, $args) =>
    p instanceof ProcessPromise ? p : $.opt(opts)(...$args)

  return (...args) => {
    if (!configurable) {
      const p = getP(args[0], opts, args)
      return p[name]()
    }

    return (...$args) => {
      const p = getP($args[0], opts, $args)
      return p[name](...args)
    }
  }
}
