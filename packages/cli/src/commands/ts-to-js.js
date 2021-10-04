import { getPaths, convertTsProjectToJs } from '@redwoodjs/internal'

export const command = 'ts-to-js'
export const description = 'Convert a TypeScript project to JavaScript'

export const handler = () => {
  convertTsProjectToJs(getPaths().base)
  convertTsProjectToJs(getPaths().scripts)
}
