import {$} from './index.mjs'

import {strict as assert} from 'node:assert'

// $.raw
{
  const cmd = 'echo foo'
  const msg = 'bar'
  const output = (await $.raw`${cmd} ${msg}`).toString().trim()
  assert(output === 'foo bar')
}

// $.silent
{
  await $.silent`echo foo`
}

// fs-extra
{
  assert(typeof fs.ensureDirSync === 'function')
}

// argv / minimist
{
  assert(typeof argv === 'object')
  console.log(argv)
}
