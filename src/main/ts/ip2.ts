/**
 * Changes
 *
 * 1. Reforged in TypeScript
 * 2. Tree-shaking friendly
 * 3. Safer family normalizer
 * 4. Exposed both strict and relaxed ipv4/ipv6 patterns
 * 5. (?) Strict mode for `fromLong()`
 * 6. Stricter `toString()` with buffer length check
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
