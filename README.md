# 🦪 zx-extra
[zx](https://github.com/google/zx) with some extras

## Requirements
* Node.js >= 16.0.0

## Install
```shell
# npm
npm i zx-extra

# yarn
yarn add zx-extra
```

## Usage
Inherits zx, so all origin methods are available. Follow [the upstream docs](https://github.com/google/zx) for details.

## Extras

### `ip`
Resolves the current IP address via [node-ip](https://github.com/indutny/node-ip).
```js
import {ip} from 'zx-extra'

ip.address() // 1.2.3.4
```

### `semver`
Semantic versioning API provided by [node-semver](https://github.com/npm/node-semver).
```js
import {semver} from 'zx-extra'

semver.gte('1.0.1', '1.0.0')
```

### `tcping`
Checks the network availability of the specified gateway via [is-reachable](https://github.com/sindresorhus/is-reachable#readme).
```js
import {tcping} from 'zx-extra'

await tcping('example.com:443') // true
await tcping('unknown:1234')    // false
```

### `tempy`
Creates [temp dirs and files](https://github.com/sindresorhus/tempy).
```js
import {tempy} from 'zx-extra'

temporaryFile()       // '/private/var/folders/p0/p7xckky93s30rshd51gs4pdc0000gn/T/1b7e9277860eb90b94aad816d4f66f8e'
temporaryDirectory()  // '/private/var/folders/p0/p7xckky93s30rshd51gs4pdc0000gn/T/1b7e9277860eb90b94aad816d4f66f8e'
```

### `copy`
Provides [`globby`-boosted copying API](https://github.com/antongolub/globby-cp).
```js
import {copy} from 'zx-extra'

await copy({
  from:       'src/**/*.js',
  to:         'dist/',
  baseFrom,   // process.cwd()
  baseTo,     // process.cwd(),
  debug,      // () => {}
  ignoreFiles // undefined
})
```

### `ctx`
[async_hooks](https://nodejs.org/api/async_hooks.html)-driven scope isolator.
Creates a separate zx-context for the specified function.

```js
import {ctx} from 'zx/experimental'

const _$ = $
ctx(async ($) => {
  await sleep(10)
  cd('/foo')
  // $.cwd refers to /foo
  // _$.cwd === $.cwd
})

ctx(async ($) => {
  await sleep(20)
  // _$.cwd refers to /foo
  // but _$.cwd !== $.cwd
})

const ref = $.bind(null)
ctx(($) => {
  ref === $ // true
}, ref)
```

### `$.preferLocal`
In npm run scripts you can execute locally installed binaries by name. This enables the same for zx.
```js
$`terser input.js --compress ecma=2015,computed_props=false`
```
Note, that yarn and npm modify `env.$PATH` value, so some `*/node_modules/.bin` binaries are available for invocation.
To disable this side-effect, append smth like [`PATH=$(env -i bash -c 'echo $PATH')` to the command](https://askubuntu.com/questions/386629/what-are-the-default-path-values).

### `$.raw`
Evaluates target cmd as is without `shq`.
```js
const cmd = 'echo foo'
const msg = 'bar'
const output = (await $.raw`${cmd} ${msg}`).toString().trim()
// $ echo foo bar
```

### `$.opt`
Returns `$` with the specified preset. Aliased for `$.o`.
```js
const $$ = $.opt({verbose: false, spawn: customSpawn})

await $$`foo 'bar'`
```

### `createHook`
Helper to create chainable extras.
```js
const quiet = createHook({ verbose: false }, 'quiet')
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

const p = $`sleep 9999`
await quiet(timeout(100, 'SIGKILL')(p))
await $`sleep 9999`.quiet().timeout(100, 'SIGKILL')
await quiet(timeout(100, 'SIGKILL')`sleep 9999`)
```

### `$.silent`
_merged as [bf88f50](bf88f5064b31dea79da4999f25425ca0fe0b8013)_    
Sets `verbose = false` for a single invocation.
```js
await $.silent`echo foo`
// <no output in console>
```

### ~~` $.fs / global.fs `~~
_merged as [d8b6b87](73cd163d710f88d1ff835ffc3e76214eca07bb9b)_  
Refers to [fs-extra](https://www.npmjs.com/package/fs-extra) instead of standard Node.js `fs` module.
```js
await fs.copy('/tmp/myfile', '/tmp/mynewfile')
```

### ~~`` global.argv ``~~
_merged as [d8b6b87](https://github.com/google/zx/commit/d8b6b87e5d48023fc23fd2a4f8513a896ee13c68)_   
Represents parsed with [minimist](https://www.npmjs.com/package/minimist) script arguments
```js
// zx-extra test.mjs --foo=bar
argv
{ _: [ 'test.mjs' ], foo: 'bar' }
```

### License
[MIT](./LICENSE)
