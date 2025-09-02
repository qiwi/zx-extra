import assert from 'node:assert'
import {test, describe} from 'node:test'
import {
  normalizeFamily,
  V4_RE,
  V6_RE,
  V4_S_RE,
  V6_S_RE,
  isV4Format,
  isV6Format,
  isV4,
  isV6,
  isLoopback,
  fromLong,
} from '../../main/ts/ip2.ts'

describe('ip', () => {
  test('normalizeFamily() normalizes input to enum', () => {
    const cases: [any, string][] = [
      [4, 'ipv4'],
      ['4', 'ipv4'],
      ['ipv4', 'ipv4'],
      [6, 'ipv6'],
      ['6', 'ipv6'],
      ['ipv6', 'ipv6'],
      [undefined, 'ipv4'],
      [null, 'ipv4'],
      ['', 'ipv4'],
    ]
    for (const [input, expected] of cases) {
      const result = normalizeFamily(input)
      assert.strictEqual(result, expected, `normalizeFamily(${input}) === ${expected}`)
    }
  })

  // prettier-ignore
  describe('ipv4/ipv6 checks', () => {
    type Check = (ip: string) => boolean
    const remap = new Map([
      [V4_RE, isV4Format],
      [V6_RE, isV6Format],
      [V4_S_RE, isV4],
      [V6_S_RE, isV6]
    ])

    const cases: [string, ...Check[]][] = [
      ['10.0.0.1', isV4Format, isV6Format, isV4],
      ['10.0.0.256', isV4Format, isV6Format],
      ['10.00.0.255', isV4Format, isV6Format],
      ['10.0.0.1111', isV6Format],
      ['10.0.0'],
      ['10.0.0.00', isV4Format, isV6Format],
      ['10.0.0.0.0'],
      ['::1', isV6Format, isV6],
      ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', isV6Format, isV6],
    ]

    for (const [input, ...checks] of cases) {
      const re = checks.map(c => [...remap.entries()].find(([,v]) => v === c)![0])
      const _re = [...remap.keys()].filter(r => !re.includes(r))
      const matches = checks.map(c => c.name).join(', ') || 'none'

      test(`${input} matches ${matches}`, () => {
        for (const c of checks) assert.ok(c(input))
        for (const p of _re) assert.doesNotMatch(input, p)
        for (const p of re) assert.match(input, p)
      })
    }
  })

  test('isLoopback()', () => {
    const cases: [string | number, boolean?][] = [
      ['127.0.0.1', true],
      ['127.8.8.8', true],
      ['fe80::1', true],
      ['::1', true],
      ['::', true],
      ['128.0.0.1'],
      [2130706434, true],
      [4294967295]
    ]

    for (const [input, expected] of cases) {
      assert.equal(isLoopback(input), !!expected, `isLoopback(${input}) === ${expected}`)
    }
  })

  test('fromLong()', () => {
    const cases: [number, string][] = [
      [2130706434, '127.0.0.2'],
      [4294967295, '255.255.255.255'],
    ]

    for (const [input, expected] of cases) {
      assert.equal(fromLong(input), expected, `fromLong(${input}) === ${expected}`)
    }
  })
})
