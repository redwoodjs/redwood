import fs from 'fs'
import path from 'path'

import { transform } from '@babel/core'
import glob from 'glob'
import { format } from 'prettier'

import { getPaths } from './paths'

/**
 * Get all the source code from a Redwood application.
 */
export const getSourceFiles = (cwd = getPaths().base) => {
  return glob.sync('**/src/**/**.{ts,js,tsx,jsx}', {
    cwd,
  })
}

/**
 * Read the contents of a TypeScript, transpile it to JavaScript and leave the
 * JSX intact. Format via Prettier.
 *
 * @param {string} src
 */
export const transformTSToJS = (src: string, cwd = getPaths().base) => {
  const tsCode = fs.readFileSync(src, 'utf-8')
  const filename = path.basename(src)

  const result = transform(tsCode, {
    filename,
    cwd,
    configFile: false,
    plugins: [
      [
        '@babel/plugin-transform-typescript',
        {
          isTSX: true,
          allExtensions: true,
        },
      ],
    ],
    retainLines: true,
  })

  if (result?.code) {
    return prettify(result.code, filename.replace(/\.ts$/, '.js'), cwd)
  }
  return undefined
}

export const prettierConfig = (cwd = getPaths().base) => {
  try {
    return require(path.join(cwd, 'prettier.config.js'))
  } catch (e) {
    return undefined
  }
}

/**
 * Determine the prettier parser based off of the extension.
 *
 * See: https://prettier.io/docs/en/options.html#parser
 * @param {string} filename
 */
const prettierParser = (filename: string) => {
  switch (path.extname(filename.replace('.template', ''))) {
    case '.css':
      return 'css'
    case '.js':
      return 'babel'
    case '.ts':
    case '.tsx':
      return 'babel-ts'
    default:
      return undefined
  }
}

/**
 * Prettify `code` according to the extension in `filename`.
 * This will also read a user's `prettier.config.js` file if it exists.
 *
 * @param {string} code
 * @param {string} filename
 */
export const prettify = (
  code: string,
  filename: string,
  cwd = getPaths().base
) => {
  const parser = prettierParser(filename)
  // Could not determine the parser, so return unformatted code.
  if (typeof parser === 'undefined') {
    return code
  }

  return format(code, {
    ...prettierConfig(cwd),
    parser,
  })
}
