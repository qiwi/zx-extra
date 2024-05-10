import path from 'node:path'

export const isString = (obj) => typeof obj === 'string'

export const randomId = () => Math.random().toString(36).slice(2)

export const isTemplateSignature = (pieces, ...args) => {
  let lastIdx = pieces.length - 1

  return Array.isArray(pieces) && pieces.every(isString) && lastIdx === args.length
}

export const injectNmBinToPathEnv = (env, ...dirs) => {
  const pathKey =
    process.platform === 'win32'
      ? Object.keys(env)
      .reverse()
      .find((key) => key.toUpperCase() === 'PATH') || 'Path'
      : 'PATH'
  const pathValue = dirs
    .map((c) => c && path.resolve(c, 'node_modules', '.bin'))
    .concat(env[pathKey])
    .filter(Boolean)
    .join(path.delimiter)

  return {
    ...env,
    [pathKey]: pathValue,
  }
}
