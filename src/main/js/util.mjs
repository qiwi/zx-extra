export const isString = (obj) => typeof obj === 'string'

export const randomId = () => Math.random().toString(36).slice(2)

export const isTemplateSignature = (pieces, ...args) => {
  let lastIdx = pieces.length - 1

  return Array.isArray(pieces) && pieces.every(isString) && lastIdx === args.length
}
