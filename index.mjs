import {$} from 'zx'
import fs from 'fs-extra'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))

$.fs = {...$.fs, ...fs}
$.raw = async (...args) => {
  const q = $.quote
  $.quote = v => v
  const p = $(...args)
  await p
  $.quote = q
  return p
}

$.silent = async (...args) => {
  const v = $.verbose
  $.verbose = false
  const p = $(...args)
  await p
  $.verbose = v
  return p
}

Object.assign(global, {
  fs: $.fs,
  argv
})
