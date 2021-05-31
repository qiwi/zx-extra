# zx-extra
zx with some useful extras

## Install
```shell
npm i zx-extra
```

## Usage
### ``$.noquote`command` ``
Runs target cmd with disabled `shq`.
```js
const cmd = 'echo foo'
const msg = 'bar'
const output = (await $.noquote`${cmd} ${msg}`).toString().trim()
// $ echo foo bar
```

