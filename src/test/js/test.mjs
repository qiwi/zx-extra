import {strict as assert} from 'node:assert'
import {$, semver, createHook, ip, tempy, tcping, sleep, ctx, copy, fs, path} from '../../main/js/index.mjs'

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
  const nothrow = createHook({nothrow: true}, 'nothrow')
  const quiet = createHook({ verbose: 0 }, 'quiet')
  const debug = createHook({ verbose: 2 }, 'debug')
  const timeout = createHook(
    null,
    'timeout',
    (p, t, signal) => {
      if (!t) return p
      let timer = setTimeout(() => p.kill(signal), t)

      p.finally(() => clearTimeout(timer))

      return p
    },
    true
  )

  await quiet`echo 'quiet'`
  await debug($`echo 'debug'`)
  await $`echo 'chained'`.quiet()

  try {
    await nothrow(quiet(timeout(100, 'SIGKILL')`sleep 9999`))
  } catch {
    console.log('killed1')
  }

  try {
    const p = $`sleep 9999`
    await nothrow(quiet(timeout(100, 'SIGKILL')(p)))
  } catch {
    console.log('killed2')
  }

  try {
    await $`sleep 9999`.timeout(100, 'SIGKILL').quiet().nothrow()
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

  $.preferLocal = false
  $.verbose = 2
}

// ip
{
  assert(/(\d+\.){3}\d+/.test(ip.address()))
}

// tempy
{
  assert(typeof tempy.temporaryDirectory() === 'string')
  assert(typeof tempy.rootTemporaryDirectory === 'string')
}

// tcping
{
  assert(await tcping('example.com:443'))
  assert(!(await tcping('unknown:1234')))
}

// copy
{
  const from = tempy.temporaryDirectory()
  const to = tempy.temporaryDirectory()
  const footxt = path.resolve(from, 'foo.txt')

  await fs.outputFile(footxt, 'foo')

  await copy({from: footxt, to})
  assert.equal((await fs.readFile(path.resolve(to, 'foo.txt'))).toString('utf-8').trim(), 'foo')
}

// ctx()
{
  await ctx(async ($) => {
    $.verbose = 0
    assert(typeof $.raw === 'function')
    assert(typeof $.o === 'function')
    assert(typeof $.opt === 'function')

    await ctx(async ($) => {
      await ctx(async ($) => {
        assert($.verbose === 0)
        assert(typeof $.raw === 'function')

        await $`echo e`
      })
    })

    await $`echo c`
    $.verbose = 2
  })
}

// $.cwd
{
  assert.ok($.cwd === process.cwd())
}
