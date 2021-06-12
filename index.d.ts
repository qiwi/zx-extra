import type fs from 'fs-extra'
import type minimist from 'minimist'
export * from 'zx'

interface $ {
  fs: fs
  raw: $
  silent: $
}

declare global {
  var argv: ReturnType<minimist>
  // https://github.com/google/zx/pull/145
  // var fs: fs
}
