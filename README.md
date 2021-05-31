# zx-extra
[zx](https://github.com/google/zx) with some useful extras

## Install
```shell
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

### ``$.silent`command` ``
Sets `verbose = false` for once invocation.
```js
await $.silent`echo foo`
// <no output in console>
```

### `` $.fs / global.fs ``
Refers to [fs-extra](https://www.npmjs.com/package/fs-extra) instead of standard Node.js `fs` module.

### `` global.argv ``
Represents parsed with [minimist](https://www.npmjs.com/package/minimist) script arguments
```js
// zx-extra test.mjs --foo=bar
argv
{ _: [ 'test.mjs' ], foo: 'bar' }
```
