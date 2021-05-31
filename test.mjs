import {strict as assert} from 'assert'

{
  const cmd = 'echo foo'
  const msg = 'bar'
  const output = (await $.noquote`${cmd} ${msg}`).toString().trim()
  assert(output === 'foo bar')
}
