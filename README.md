# 🦪 zx-extra
[zx](https://github.com/google/zx) with some out-of-scope extras.

## Install
```shell
# npm
npm i zx-extra

# yarn
yarn add zx-extra
```

## Usage
Inherits zx, so all origin methods are available.

## Extras

### `semver`
Semantic versioning api from [node-semver](https://github.com/npm/node-semver)
```js
import {semver} from 'zx-extra'

semver.gte('1.0.1', '1.0.0')
```

### `$.raw`
Evaluates target cmd as is without `shq`.
```js
const cmd = 'echo foo'
const msg = 'bar'
const output = (await $.raw`${cmd} ${msg}`).toString().trim()
// $ echo foo bar
```

### `$.opt`
Returns `$` with the specified preset.
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
