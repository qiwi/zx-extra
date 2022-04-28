# 🦪 zx-extra
[zx](https://github.com/google/zx) with some useful extras

## Install
```shell
# npm
npm i zx-extra

# yarn
npm i zx-extra
```

## Usage
### ``$.raw`command` ``
Evaluates target cmd as is with disabled `shq`.
```js
const cmd = 'echo foo'
const msg = 'bar'
const output = (await $.raw`${cmd} ${msg}`).toString().trim()
// $ echo foo bar
```

### ``$.silent`command` `` (merged as `quiet`)
Sets `verbose = false` for once invocation.
```js
await $.silent`echo foo`
// <no output in console>
```

### ~~`` $.fs / global.fs ``~~ (merged)
Refers to [fs-extra](https://www.npmjs.com/package/fs-extra) instead of standard Node.js `fs` module.
```js
await fs.copy('/tmp/myfile', '/tmp/mynewfile')
```

### ~~`` global.argv ``~~ (merged)
Represents parsed with [minimist](https://www.npmjs.com/package/minimist) script arguments
```js
// zx-extra test.mjs --foo=bar
argv
{ _: [ 'test.mjs' ], foo: 'bar' }
```
