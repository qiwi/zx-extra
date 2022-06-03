import {strict as assert} from 'node:assert'
import {$, semver, createHook, ip} from '../../main/js/index.mjs'

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

  assert($.opt === $.o)
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

  try {
    timeout`echo 'foo'`
  } catch (e) {
    assert(e.message.startsWith('Configurable hook requires options'))
  }
}

// preferLocal
{
  $.verbose = 0
  try {
    await $`ps-tree`
  } catch (e){
    assert.ok(/command not found/.test(e.message))
  }

  $.preferLocal = true

  await $`ps-tree`

  $.verbose = 2
}

// ip
{
  assert(/(\d+\.){3}\d+/.test(ip.address()))
}

