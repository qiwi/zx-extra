import {$ as _$, quiet, ProcessPromise, within} from 'zx'
import {isTemplateSignature, randomId} from './util.mjs'
import {npmRunPath} from 'npm-run-path'
import {DeepProxy} from '@qiwi/deep-proxy'

export * from 'zx'
export * from './goods.mjs'

export const $ = new DeepProxy(_$, ({DEFAULT, target: t, trapName, args}) => {
  if (trapName === 'apply') {
    if (!t.preferLocal) {
      return DEFAULT
    }
    const env = t.env
    t.env = {...t.env, PATH: npmRunPath({cwd: t.cwd})}
    try {
      return t(...args)
    } finally {
      t.env = env
    }
  }

  return DEFAULT
})

export const ctx = (cb, ref = $) => within(() => cb(ref))

$.raw = async (...args) => $.o({quote: v => v})(...args)

// https://github.com/google/zx/pull/134
$.silent = async (...args) => quiet($(...args))

$.o = $.opt =
  (opts) =>
    (...args) =>
      ctx(($) => {
        Object.assign(_$, opts)
        const p = $(...args)
        if (p._snapshot.nothrow) p._nothrow = true
        return p
      })

export const createHook = (opts, name = randomId(), cb = (v) => v, configurable) => {
  ProcessPromise.prototype[name] = function (...args) {
    Object.assign(this._snapshot, opts)
    if (this._snapshot.nothrow) this._nothrow = true

    return cb(this, ...args)
  }

  const getP = (p, opts, $args) =>
    p instanceof ProcessPromise ? p : $.opt(opts)(...$args)

  return (...args) => {
    if (!configurable) {
      const p = getP(args[0], opts, args)
      return p[name]()
    }

    if (isTemplateSignature(...args)) {
      throw new Error('Configurable hook requires options: use $.hook(a, b)`cmd --foo bar` instead of $.hook`cmd --foo bar`')
    }

    return (...$args) => {
      const p = getP($args[0], opts, $args)
      return p[name](...args)
    }
  }
}
