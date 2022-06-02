import {$, semver} from '../../main/js/index.mjs'

import {strict as assert} from 'node:assert'

// $.raw
{
  const cmd = 'echo raw foo'
  const msg = 'bar'
  const output = (await $.raw`${cmd} ${msg}`).toString().trim()
  assert(output === 'raw foo bar')
}

// $.silent
{
  await $.silent`echo silent`
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

{
  assert(semver.gte('1.0.1', '1.0.0'))
  assert(!semver.lt('1.0.0', '1.0.0'))
}
