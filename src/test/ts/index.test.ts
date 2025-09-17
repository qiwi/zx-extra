import {strict as assert} from 'node:assert'
import {$, createHook, ProcessPromise} from 'zx-extra'
import {test, describe} from 'node:test'

describe('createHook()', () => {
  test('applies hook as mixin', async () => {
    const h1 = createHook({foo: 'bar'}, 'foo', function (p: ProcessPromise, param: string) {
      return `${this.id}${param}${(p as any)._snapshot.foo}`
    }, true)

    const p1 = $`echo baz`
    await p1

    assert.ok(p1.foo('qux').endsWith('quxbar'))
  })

  test('invokes hook separately', async () => {
    const h2 = createHook({}, 'h2', () => {}, false)
    const h3 = createHook({}, 'h3', (p, a: number) => { return a }, true)

    const p2 = h3(42)`echo h3`
    assert.equal(p2, 42)
  })
})



