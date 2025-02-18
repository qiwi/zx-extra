export const isString = (obj: any) => typeof obj === 'string'

export const randomId = () => Math.random().toString(36).slice(2)

export const isTemplateSignature = (pieces: any, ...args: any[]) => {
  return Array.isArray(pieces) && pieces.every(isString) && (pieces.length - 1 === args.length)
}
