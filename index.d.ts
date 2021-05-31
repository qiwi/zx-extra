import type fs from 'fs-extra'
export * from 'zx'

interface $ {
  fs: fs
  raw: $
  silent: $
}
