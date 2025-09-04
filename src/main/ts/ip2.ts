/**
 * Changes
 *
 * 1. Reforged in TypeScript
 * 2. Tree-shaking friendly
 * 3. Safer family normalizer
 * 4. Exposed both strict and relaxed ipv4/ipv6 patterns
 * 5. (?) Strict mode for `fromLong()`
 * 6. Stricter `toString()` with buffer length check
 * 7. Improved fromPrefixLen() family hint
 *
 * @module ip2
 */


import { Buffer } from 'buffer'
import os from 'os'

const PUB = 'public'
const PVT = 'private'
const IPV4 = 'ipv4'
const IPV6 = 'ipv6'

// https://stackoverflow.com/questions/5284147/validating-ipv4-addresses-with-regexp
// https://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
export const V4_RE = /^(\d{1,3}(\.|$)){4}$/
export const V6_RE = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i
export const V4_S_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
export const V6_S_RE = /(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

export type Family = typeof IPV4 | typeof IPV6
export function normalizeFamily(family?: string | number): Family {
  const f = `${family}`.toLowerCase().trim()
  if (f === '6' || f === IPV6) return IPV6
  return IPV4
}

export const isV4Format = (ip: string)=> V4_RE.test(ip) // Legacy
export const isV6Format = (ip: string)=> V6_RE.test(ip) // Legacy
export const isV4 = (ip: string)=> V4_S_RE.test(ip)
export const isV6 = (ip: string)=> V6_S_RE.test(ip)

// Loopbacks
const LB_V4 = '127.0.0.1'
const LB_V6 = 'fe80::1'
const LB_RE = /^(::f{4}:)?127\.(\d{1,3}(\.|$)){3}$/

export const isLoopback = (addr: string | number) => {
  let a = (addr + '').toLowerCase()
  const s = a.slice(0, 5)

  // If addr is an IPv4 address in long integer form (no dots and no colons), convert it
  if (!a.includes('.') && !a.includes(':'))
    a = fromLong(+addr)

  return s === '::1'
      || s === '::'
      || s === '0177.'
      || s === '0x7f.'
      || a === LB_V6
      || a === LB_V4
      || LB_RE.test(a)
}

export const fromLong = (n: number): string =>
  [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff
  ].join('.')

export const toLong = (ip: string): number =>
  ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0

export const toString = (buff: Buffer, offset = 0, length?: number): string => {
  const o = ~~offset
  const l = length || (buff.length - offset)

  // IPv4
  if (l === 4)
    return [...buff.subarray(o, o + l)].join('.')

  // IPv6
  if (l === 16)
    return Array
      .from({ length: l / 2 }, (_, i) =>
        buff.readUInt16BE(o + i * 2).toString(16))
      .join(':')
      .replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3')
      .replace(/:{3,4}/, '::')

  throw new Error('Invalid buffer length for IP address')
}

export const toBuffer = (ip: string, buff?: Buffer, offset = 0): Buffer => {
  offset = ~~offset

  if (isV4Format(ip)) {
    const res = buff || Buffer.alloc(offset + 4)
    for (const byte of ip.split('.'))
      res[offset++] = +byte & 0xff

    return res
  }

  if (isV6Format(ip)) {
    let sections = ip.split(':', 8)

    // expand IPv4-in-IPv6
    for (let i = 0; i < sections.length; i++) {
      if (isV4Format(sections[i])) {
        const v4 = toBuffer(sections[i])
        sections[i] = v4.slice(0, 2).toString('hex')
        if (++i < 8) sections.splice(i, 0, v4.slice(2, 4).toString('hex'))
      }
    }

    // expand ::
    if (sections.includes('')) {
      const emptyIndex = sections.indexOf('')
      const pad = 8 - sections.length + 1
      sections.splice(emptyIndex, 1, ...Array(pad).fill('0'))
    } else {
      while (sections.length < 8) sections.push('0')
    }

    // write result
    const res = buff || Buffer.alloc(offset + 16)
    for (const sec of sections) {
      const word = parseInt(sec, 16) || 0
      res[offset++] = word >> 8
      res[offset++] = word & 0xff
    }
    return res
  }

  throw Error(`Invalid ip address: ${ip}`)
}

export const fromPrefixLen = (prefixlen: number, family?: string | number): string => {
  family = prefixlen > 32 ? 'ipv6' : normalizeFamily(family)
  const buff = Buffer.alloc(family === 'ipv6' ? 16 : 4)

  for (let i = 0; i < buff.length; i++) {
    const bits = Math.min(prefixlen, 8)
    prefixlen -= bits
    buff[i] = ~(0xff >> bits) & 0xff
  }

  return toString(buff)
}

export const mask = (addr: string, maskStr: string): string => {
  const a = toBuffer(addr)
  const m = toBuffer(maskStr)
  const out = Buffer.alloc(Math.max(a.length, m.length))

  if (a.length === m.length) {
    // Same protocol → direct AND
    for (let i = 0; i < a.length; i++) out[i] = a[i] & m[i]
  } else if (m.length === 4) {
    // IPv6 addr with IPv4 mask → apply to low 32 bits
    for (let i = 0; i < 4; i++) out[i] = a[a.length - 4 + i] & m[i]
  } else {
    // IPv4 addr with IPv6 mask → expand to ::ffff:ipv4
    out.fill(0, 0, 10)
    out[10] = out[11] = 0xff
    for (let i = 0; i < a.length; i++) out[i + 12] = a[i] & m[i + 12]
  }

  return toString(out)
}

export const cidr = (cidrString: string): string => {
  const [addr, prefix] = cidrString.split('/')

  if (!addr || prefix === undefined)
    throw new Error(`invalid CIDR subnet: ${cidrString}`)

  const m = fromPrefixLen(parseInt(prefix, 10))
  return mask(addr, m)
}

export const subnet = (addr: string, smask: string) => {
  const networkAddress = toLong(mask(addr, smask))

  // calculate prefix length
  const maskBuffer = toBuffer(smask)
  let maskLength = 0
  for (const byte of maskBuffer) {
    if (byte === 0xff) {
      maskLength += 8
    } else {
      let b = byte
      while (b) {
        b = (b << 1) & 0xff
        maskLength++
      }
    }
  }

  const numAddresses = 2 ** (32 - maskLength)
  const firstAddress =
    numAddresses <= 2 ? networkAddress : networkAddress + 1
  const lastAddress =
    numAddresses <= 2
      ? networkAddress + numAddresses - 1
      : networkAddress + numAddresses - 2

  return {
    networkAddress:   fromLong(networkAddress),
    firstAddress:     fromLong(firstAddress),
    lastAddress:      fromLong(lastAddress),
    broadcastAddress: fromLong(networkAddress + numAddresses - 1),
    subnetMask:       smask,
    subnetMaskLength: maskLength,
    numHosts:         numAddresses <= 2 ? numAddresses : numAddresses - 2,
    length:           numAddresses,
    contains(other: string): boolean {
      return networkAddress === toLong(mask(other, smask))
    },
  }
}
