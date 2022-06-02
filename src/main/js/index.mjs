import {$, quiet} from 'zx'

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
