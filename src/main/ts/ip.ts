/**
 * This module is a drop-down replacement for the 'ip' npm package (https://github.com/indutny/node-ip)
 *
 *    Rewritten in TypeScript.
 *    Eliminates annoying vulnerability CVE-2024-29415.
 *    Brings various fixes and improvements.
 */

import { Buffer } from 'buffer'
import os from 'os'

const PUBLIC = 'public'
const PRIVATE = 'private'
export const IPV4 = 'IPv4'
export const IPV6 = 'IPv6'

// https://stackoverflow.com/questions/5284147/validating-ipv4-addresses-with-regexp
// https://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
export const V4_RE = /^(\d{1,3}(\.|$)){4}$/
export const V6_RE = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i
export const V4_S_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
export const V6_S_RE = /(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

export const isV4Format = (ip: string): boolean => V4_RE.test(ip) // Legacy
export const isV6Format = (ip: string): boolean => V6_RE.test(ip) // Legacy
export const isV4 = (ip: string): boolean => V4_S_RE.test(ip)
export const isV6 = (ip: string): boolean => V6_S_RE.test(ip)

// Corresponds Nodejs.NetworkInterfaceBase
export type Family = typeof IPV4 | typeof IPV6
export function normalizeFamily(family?: string | number): Family {
  const f = `${family}`.toLowerCase().trim()
  return f === '6' || f === IPV6.toLowerCase()
    ? IPV6
    : IPV4
}

export const normalizeAddress = (addr: string | number): string => {
  const _a = (addr + '').toLowerCase()

  return _a.includes(':')
    ? toString(toBuffer(_a))
    : fromLong(normalizeToLong(_a))
}

export const normalizeToLong = (addr: string): number => {
  const parts = addr.split('.').map(part => {
    if (/^0x[0-9a-f]+$/i.test(part))
      return parseInt(part, 16) // hex

    if (/^0[0-7]+$/.test(part))
      return parseInt(part, 8) // octal

    if (/^(0|[1-9]\d*)$/.test(part))
      return parseInt(part, 10) // decimal

    return NaN // invalid
  })

  if (parts.some(isNaN)) return -1

  let val: number
  switch (parts.length) {
    case 1:
      val = parts[0]
      break
    case 2:
      if (parts[0] > 0xff || parts[1] > 0xffffff) return -1
      val = (parts[0] << 24) | (parts[1] & 0xffffff)
      break
    case 3:
      if (parts[0] > 0xff || parts[1] > 0xff || parts[2] > 0xffff) return -1
      val = (parts[0] << 24) | (parts[1] << 16) | (parts[2] & 0xffff)
      break
    case 4:
      if (parts.some(p => p > 0xff)) return -1
      val = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]
      break
    default:
      return -1
  }

  return val >>> 0 // force unsigned
}

// Loopbacks
const V4_LB = '127.0.0.1'
const V6_LB = 'fe80::1'

export const isLoopback = (addr: string | number): boolean => {
  const a = normalizeAddress(addr)
  const s = a.slice(0, 5)

  return s === '::1'
      || s === '::'
      || s === '0177.'
      || s === '0x7f.'
      || a === V6_LB
      || a === V4_LB
      || a.startsWith('::ffff:7')
      || /^(::f{4}:)?127\.(\d{1,3}(\.|$)){3}$/.test(a)
}

export const loopback = (family?: string | number): typeof V4_LB | typeof V6_LB => {
  family = normalizeFamily(family)

  if (family === IPV4) return V4_LB
  if (family === IPV6) return V6_LB

  throw new Error('family must be ipv4 or ipv6')
}

export const fromLong = (n: number): string => {
  if (n < 0) throw new Error('invalid ipv4 long')

  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff
  ].join('.')
}

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
  family = prefixlen > 32 ? IPV6 : normalizeFamily(family)
  const buff = Buffer.alloc(family === IPV6 ? 16 : 4)

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

type Subnet = {
  networkAddress: string
  firstAddress: string
  lastAddress: string
  broadcastAddress: string
  subnetMask: string
  subnetMaskLength: number
  numHosts: number
  length: number
  contains(ip: string): boolean
}

export const subnet = (addr: string, smask: string): Subnet => {
  const networkAddress = toLong(mask(addr, smask))

  // calculate prefix length
  const maskBuf = toBuffer(smask)
  let maskLen = 0
  for (const byte of maskBuf) {
    if (byte === 0xff) {
      maskLen += 8
    } else {
      let b = byte
      while (b) {
        b = (b << 1) & 0xff
        maskLen++
      }
    }
  }

  const numAddresses = 2 ** (32 - maskLen)
  const numHosts = numAddresses <= 2 ? numAddresses : numAddresses - 2
  const firstAddress = numAddresses <= 2 ? networkAddress : networkAddress + 1
  const lastAddress = numAddresses <= 2
    ? networkAddress + numAddresses - 1
    : networkAddress + numAddresses - 2

  return {
    networkAddress:   fromLong(networkAddress),
    firstAddress:     fromLong(firstAddress),
    lastAddress:      fromLong(lastAddress),
    broadcastAddress: fromLong(networkAddress + numAddresses - 1),
    subnetMask:       smask,
    subnetMaskLength: maskLen,
    numHosts,
    length:           numAddresses,
    contains(ip: string): boolean {
      return networkAddress === toLong(mask(ip, smask))
    },
  }
}

const parseCidr = (cidrString: string): [string, string] => {
  const [addr, prefix] = cidrString.split('/')
  if (!addr || prefix === undefined)
    throw new Error(`invalid CIDR subnet: ${cidrString}`)

  const m = fromPrefixLen(parseInt(prefix, 10))
  return [addr, m]
}

export const cidr = (cidrString: string): string =>
  mask(...parseCidr(cidrString))

export const cidrSubnet = (cidrString: string): Subnet =>
  subnet(...parseCidr(cidrString))

export const not = (addr: string): string => {
  const buff = toBuffer(addr)
  for (let i = 0; i < buff.length; i++) buff[i] ^= 0xff
  return toString(buff)
}

export const or = (a: string, b: string): string => {
  let buffA = toBuffer(a)
  let buffB = toBuffer(b)

  if (buffA.length === buffB.length) {
    for (let i = 0; i < buffA.length; i++) buffA[i] |= buffB[i]
    return toString(buffA)
  }

  // mixed protocols: use longer buffer as base
  if (buffB.length > buffA.length) [buffA, buffB] = [buffB, buffA]

  const offset = buffA.length - buffB.length
  for (let i = 0; i < buffB.length; i++) buffA[offset + i] |= buffB[i]

  return toString(buffA)
}

export const isEqual = (a: string, b: string): boolean => {
  let ab = toBuffer(a)
  let bb = toBuffer(b)

  // same protocol
  if (ab.length === bb.length) {
    for (let i = 0; i < ab.length; i++) {
      if (ab[i] !== bb[i]) return false
    }
    return true
  }

  // ensure ab is IPv4 and bb is IPv6
  if (bb.length === 4) [ab, bb] = [bb, ab]

  // first 10 bytes must be zero
  for (let i = 0; i < 10; i++) if (bb[i] !== 0) return false

  // next 2 bytes must be either 0x0000 or 0xffff (::ffff:ipv4)
  const prefix = bb.readUInt16BE(10)
  if (prefix !== 0 && prefix !== 0xffff) return false

  // last 4 bytes must match IPv4 buffer
  for (let i = 0; i < 4; i++) if (ab[i] !== bb[i + 12]) return false

  return true
}

export const isPrivate = (addr: string): boolean => {
  if (isLoopback(addr)) return true

  // private ranges
  return (
    /^(::f{4}:)?10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.test(addr) ||  // 10.0.0.0/8
    /^(::f{4}:)?192\.168\.(\d{1,3})\.(\d{1,3})$/i.test(addr) ||       // 192.168.0.0/16
    /^(::f{4}:)?172\.(1[6-9]|2\d|3[01])\.(\d{1,3})\.(\d{1,3})$/i.test(addr) || // 172.16.0.0 – 172.31.255.255
    /^(::f{4}:)?169\.254\.(\d{1,3})\.(\d{1,3})$/i.test(addr) ||       // link-local
    /^f[cd][0-9a-f]{2}:/i.test(addr) ||                               // unique local (fc00::/7)
    /^fe80:/i.test(addr) ||                                           // link-local (fe80::/10)
    addr === '::1' ||                                                 // loopback (::1)
    addr === '::'                                                     // unspecified (::)
  )
}

export const isPublic = (addr: string): boolean => !isPrivate(addr)

export const addresses = (name?: string, family?: string): string[] => {
  const interfaces = os.networkInterfaces()
  const fam = normalizeFamily(family)
  const check =
    name === PUBLIC ? isPublic
    : name === PRIVATE ? isPrivate
      : () => true

  // specific NIC requested
  if (name && name !== PRIVATE && name !== PUBLIC) {
    const nic = interfaces[name]
    if (!nic) return []
    const match = nic.find(details => normalizeFamily(details.family) === fam)
    return [match?.address!]
  }

  // scan all NICs
  const all = Object.values(interfaces).reduce<string[]>((acc, nic) => {
    for (const {family, address} of nic ?? []) {
      if (normalizeFamily(family) !== fam) continue
      if (isLoopback(address)) continue
      if (check(address)) acc.push(address)
    }
    return acc
  }, [])

  return all.length ? all : [loopback(fam)]
}

export const address = (name?: string, family?: string): string | undefined =>
  addresses(name, family)[0]

export const ip = {
  address,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  isEqual,
  isLoopback,
  isPrivate,
  isPublic,
  isV4Format,
  isV6Format,
  loopback,
  mask,
  not,
  or,
  subnet,
  toBuffer,
  toLong,
  toString,
}
