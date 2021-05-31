import {$} from 'zx'

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
