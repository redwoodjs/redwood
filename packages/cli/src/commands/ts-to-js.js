import { getPaths } from '@redwoodjs/internal'
import { convertTsProjectToJs } from '@redwoodjs/internal/devtools'

export const command = 'ts-to-js'
export const description = 'Convert a TypeScript project to JavaScript'

export const handler = () => {
  convertTsProjectToJs(getPaths().base)
}
