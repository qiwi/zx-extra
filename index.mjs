import {$} from 'zx'
import fs from 'fs-extra'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))

$.fs = {...$.fs, ...fs}
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
  const v = $.verbose
  $.verbose = false
  // https://github.com/google/zx/pull/134
  return $(...args).finally(() => {$.verbose = v})
}

Object.assign(global, {
  fs: $.fs,
  argv
})
