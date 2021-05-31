import {$} from 'zx'

$.noquote = async (...args) => {
  const q = $.quote
  $.quote = v => v
  const p = $(...args)
  await p
  $.quote = q
  return p
}
