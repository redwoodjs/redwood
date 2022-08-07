import { getPaths } from '@redwoodjs/internal/dist/paths'
import {
  convertTsProjectToJs,
  convertTsScriptsToJs,
} from '@redwoodjs/internal/dist/ts2js'

export const command = 'ts-to-js'
export const description = 'Convert a TypeScript project to JavaScript'

export const handler = () => {
  convertTsProjectToJs(getPaths().base)
  convertTsScriptsToJs(getPaths().base)
}
