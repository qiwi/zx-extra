import {strict as assert} from 'node:assert'
import {
  $,
  semver,
  ver,
  ctx,
  createHook,
  ip,
  tempy,
  tcping,
  copy,
  fs,
  path,
  SSRI,
  INI
} from '../../main/js/index.mjs'

// $.verbose
{
  assert($.verbose === false)
}

// $.trim
{
  $.trim = false
  const _output = await $`echo foobar`

  assert(_output.toString() !== 'foobar')
  assert(_output.toString().trim() === 'foobar')

  $.trim = true
  const output = await $`echo foobar`

  assert(output.toString() === 'foobar')
  assert(output == 'foobar')
  assert(/foo/.test(output))
  assert(`${output}baz` === 'foobarbaz')
}

// $.raw
{
  const cmd = 'echo raw foo'
  const msg = 'bar'
  const output = await $.raw`${cmd} ${msg}`

  assert(output.toString().trim() === 'raw foo bar')
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

// ver
{
  assert.equal(ver('ip'), '1.1.8')
  assert(ver('git').match(/^\d+\.\d+\.\d+$/))
  assert(ver('git', '>=2'))
  assert.throws(() => ver('git', '>=5'), {message: /^git@\d+\.\d+\.\d+ does not satisfy >=5$/})
  assert.throws(() => ver('unknownbin'), {message: 'unknownbin not found'})
}

// SSRI
{
  const integrity = 'sha512-9KhgCRIx/AmzC8xqYJTZRrnO8OW2Pxyl2DIMZSBOr0oDvtEFyht3xpp71j/r/pAe1DM+JI/A+line3jUBgzQ7A==?foo'
  const parsed = SSRI.parse(integrity)
  assert.equal(SSRI.stringify(parsed), integrity)
  assert.equal(parsed.toString(), integrity)
}

// INI
{
  const ini = `[database]
user = dbuser
password = dbpassword
`
  const parsed = INI.parse(ini)
  assert.equal(parsed.database.user, 'dbuser')
  assert.equal(INI.stringify(parsed, {whitespace: true}), ini)
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
  const SIGNAL = 'SIGTERM'
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
    await nothrow(quiet(timeout(100, SIGNAL)`sleep 9999`))
  } catch {
    console.log('killed1')
  }

  try {
    const p = $`sleep 9999`
    await nothrow(quiet(timeout(100, SIGNAL)(p)))
  } catch {
    console.log('killed2')
  }

  try {
    await $`sleep 9999`.timeout(100, SIGNAL).quiet().nothrow()
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

  {
    await ctx(async ($) => {
      $.verbose = 0
      const temp1 = tempy.temporaryDirectory()
      const temp2 = tempy.temporaryDirectory()
      $.cwd = temp1
      assert.equal($.cwd, temp1)
      assert.equal($.cwd, temp1)

      await $`pwd`
      assert.equal((await $`pwd`).toString().trim(), temp1)
      assert.equal($.cwd, temp1)
      assert.equal((await $`pwd`).toString().trim(), temp1)

      $.cwd = temp2
      assert.equal((await $`pwd`).toString().trim(), temp2)
      assert.equal((await $`pwd`).toString().trim(), temp2)
      assert.equal($.cwd, temp2)
    })
  }
}

// $.cwd
{
  assert.ok($.cwd === process.cwd())
}
