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
  fromPrefixLen,
  toBuffer,
  toString,
  mask,
  cidr,
  subnet,
} from '../../main/ts/ip2.ts'
import {Buffer} from "buffer";

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

  test('toBuffer()/toString()', () => {
    const u = undefined
    const cases: [string, Buffer | undefined, number | undefined, number | undefined, string, string?][] = [
      ['127.0.0.1', u, u, u, '7f000001'],
      ['::ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
      ['127.0.0.1', Buffer.alloc(128), 64, 4, '0'.repeat(128) + '7f000001' + '0'.repeat(120)],
      ['::1', u, u, u, '00000000000000000000000000000001'],
      ['1::', u, u, u, '00010000000000000000000000000000'],
      ['abcd::dcba', u, u, u, 'abcd000000000000000000000000dcba'],
      ['::1', Buffer.alloc(128), 64, 16, '0'.repeat(128 + 31) + '1' + '0'.repeat(128 - 32)],
      ['abcd::dcba', Buffer.alloc(128), 64, 16, '0'.repeat(128) + 'abcd000000000000000000000000dcba' + '0'.repeat(128 - 32)],
      ['::ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
      ['ffff::127.0.0.1', u, u, u, 'ffff000000000000000000007f000001', 'ffff::7f00:1'],
      ['0:0:0:0:0:ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
    ]
    for (const [input, b, o, l, h, s = input] of cases) {
      const buf = toBuffer(input, b, o)
      const str = toString(buf, o, l)
      const hex = buf.toString('hex')

      assert.equal(hex, h, `toBuffer(${input}).toString('hex') === ${h}`)
      assert.equal(str, s, `toString(toBuffer(${input})) === ${s}`)
    }
  })

  test('fromPrefixLen()', () => {
    const cases: [number, string, (string | number)?][] = [
      [24, '255.255.255.0'],
      [64, 'ffff:ffff:ffff:ffff::'],
      [24, 'ffff:ff00::', 'IPV6'],
    ]

    for (const [input, expected, family] of cases) {
      const res = fromPrefixLen(input, family)
      assert.strictEqual(res, expected, `fromPrefixLen(${input}, ${family}) === ${expected}`)
    }
  })

  test('mask()', () => {
    const cases: [string, string, string][] = [
      ['192.168.1.134', '255.255.255.0', '192.168.1.0'],
      ['192.168.1.134', '::ffff:ff00', '::ffff:c0a8:100'],
      ['::1', '0.0.0.0', '::']
    ]

    for (const [a, m, expected] of cases) {
      const res = mask(a, m)
      assert.strictEqual(res, expected, `mask(${a}, ${m}) === ${expected}`)
    }
  })

  test('cidr()', () => {
    const cases: [string, string][] = [
      ['192.168.1.134/26', '192.168.1.128'],
      ['2607:f0d0:1002:51::4/56', '2607:f0d0:1002::']
    ]

    for (const [input, expected] of cases) {
      const res = cidr(input)
      assert.strictEqual(res, expected, `cidr(${input}) === ${expected}`)
    }

    assert.throws(() => cidr(''), /Error: invalid CIDR subnet/)
  })

  test('subnet()', () => {
    const cases: [string, string, Record<string, any>, string[], string[]][] = [
      ['192.168.1.134', '255.255.255.192', {
        networkAddress: '192.168.1.128',
        firstAddress:   '192.168.1.129',
        lastAddress:    '192.168.1.190',
        broadcastAddress: '192.168.1.191',
        subnetMask:     '255.255.255.192',
        subnetMaskLength: 26,
        numHosts:      62,
        length:        64,
      }, ['192.168.1.180'], ['192.168.1.192']],

      ['192.168.1.134', '255.255.255.255', {
        firstAddress: '192.168.1.134',
        lastAddress:  '192.168.1.134',
        numHosts: 1
      }, ['192.168.1.134'], []],
      ['192.168.1.134', '255.255.255.254', {
        firstAddress: '192.168.1.134',
        lastAddress:  '192.168.1.135',
        numHosts: 2
      }, [], []]
    ]
    for (const [addr, smask, expected, inside, out] of cases) {
      const res = subnet(addr, smask)
      for (const k of Object.keys(expected))
        assert.strictEqual(res[k as keyof typeof res], expected[k], `subnet(${addr}, ${smask}).${k} === ${expected[k]}`)

      assert.ok(inside.every(a => res.contains(a)), `subnet(${addr}, ${smask}) contains ${inside.join(', ')}`)
      assert.ok(out.every(a => !res.contains(a)), `subnet(${addr}, ${smask}) does not contain ${out.join(', ')}`)
    }
  })
})
