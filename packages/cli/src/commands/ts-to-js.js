import {
  convertTsProjectToJs,
  convertTsScriptsToJs,
} from '@redwoodjs/internal/dist/ts2js'
import { getPaths } from '@redwoodjs/project-config'

export const command = 'ts-to-js'
export const description =
  '[DEPRECATED]\n' + 'Convert a TypeScript project to JavaScript'

export const handler = () => {
  convertTsProjectToJs(getPaths().base)
  convertTsScriptsToJs(getPaths().base)
}
