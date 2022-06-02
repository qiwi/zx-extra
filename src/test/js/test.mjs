import {$, semver, createHook} from '../../main/js/index.mjs'

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

// semver
{
  assert(semver.gte('1.0.1', '1.0.0'))
  assert(!semver.lt('1.0.0', '1.0.0'))
}

// opt
{
  const nothrow = $.opt({nothrow: true})
  const thrown = await nothrow`foo bar`

  assert(/foo: command not found/.test(thrown.stderr.toString()))
}

// hooks
{
  const quiet = createHook({ verbose: false }, 'quiet')
  const debug = createHook({ verbose: 2 }, 'debug')
  const timeout = createHook(
    null,
    'timeout',
    (p, t, signal) => {
      if (!t) return p
      let timer = setTimeout(() => p.kill(signal), t)

      return Object.assign(
        p.finally(() => clearTimeout(timer)),
        p
      )
    },
    true
  )

  await quiet`echo 'quiet'`
  await debug($`echo 'debug'`)
  await $`echo 'chained'`.quiet()

  try {
    await quiet(timeout(100, 'SIGKILL')`sleep 9999`)
  } catch {
    console.log('killed1')
  }

  try {
    const p = $`sleep 9999`
    await quiet(timeout(100, 'SIGKILL')(p))
  } catch {
    console.log('killed2')
  }

  try {
    await $`sleep 9999`.quiet().timeout(100, 'SIGKILL')
  } catch {
    console.log('killed3')
  }
}

process.exit(0)
