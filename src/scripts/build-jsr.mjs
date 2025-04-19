import fs from 'node:fs'
import path from 'node:path'
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const root = path.resolve(__dirname, '../..')
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(root, 'package.json'), 'utf-8'))
const deps = pkgJson.dependencies

const prodDeps = new Set(Object.keys(deps))
const jsrDeps = {
  zx: 'jsr:@webpod/zx',
}

fs.writeFileSync(
  path.resolve(root, 'jsr.json'),
  JSON.stringify(
    {
      name: '@qiwi/zx-extra',
      version: pkgJson.version,
      license: pkgJson.license,
      exports: {
        '.': './src/main/ts/index.ts'
      },
      publish: {
        include: ['src/main/ts', 'README.md', 'LICENSE'],
      },
      nodeModulesDir: 'auto',
      imports: Object.entries(deps).reduce(
        (m, [k, v]) => {
          if (prodDeps.has(k)) {
            const name = jsrDeps[k] || `npm:${k}`
            m[k] = `${name}@${v}`
          }
          return m
        },
        {}
      ),
    },
    null,
    2
  )
)

