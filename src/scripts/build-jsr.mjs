import fs from 'fs'
import path from 'path'
const cwd = process.cwd()
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf-8'))

fs.writeFileSync(path.resolve(cwd, 'jsr.json'), JSON.stringify({
  name: '@qiwi/zx-extra',
  version: pkgJson.version,
  exports: {
    '.': './src/main/ts/index.ts'
  },
  publish: {
    include: [
      'src/main/ts',
      'README.md'
    ]
  }
}, null, 2))
