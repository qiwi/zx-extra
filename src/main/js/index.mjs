import {$ as _$, quiet, ProcessPromise} from 'zx'
import {ctx} from 'zx/experimental'
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

$.raw = async (...args) => {
  const q = $.quote
  $.quote = v => v
  try {
    return $(...args)
  } finally {
    $.quote = q
  }
}

// https://github.com/google/zx/pull/134
$.silent = async (...args) => quiet($(...args))

$.o = $.opt =
  (opts) =>
    (...args) =>
      ctx(($) => Object.assign($, opts)(...args))

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

    if (isTemplateSignature(...args)) {
      throw new Error('Configurable hook requires options: use $.hook(a, b)`cmd --foo bar` instead of $.hook`cmd --foo bar`')
    }

    return (...$args) => {
      const p = getP($args[0], opts, $args)
      return p[name](...args)
    }
  }
}
