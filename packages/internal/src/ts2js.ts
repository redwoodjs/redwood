import fs from 'fs'
import path from 'path'

import { transform } from '@babel/core'
import glob from 'glob'
import { format } from 'prettier'

import { getPaths } from './paths'

/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
export const convertTsProjectToJs = (cwd = getPaths().base) => {
  const files = typeScriptSourceFiles(cwd)
  for (const f of files) {
    const code = transformTSToJS(f)
    if (code) {
      fs.writeFileSync(
        path.join(cwd, f.replace('.tsx', '.js').replace('.ts', '.js')),
        code,
        'utf8'
      )
      fs.unlinkSync(path.join(cwd, f))
    }
  }

  try {
    fs.renameSync(
      path.join(cwd, 'api/tsconfig.json'),
      path.join(cwd, 'api/jsconfig.json')
    )
    fs.renameSync(
      path.join(cwd, 'web/tsconfig.json'),
      path.join(cwd, 'web/jsconfig.json')
    )
  } catch (e) {
    // I want the user to be able to run this command multiple times.
    console.error(e)
  }
}

/**
 * Get all the source code from a Redwood project
 */
export const typeScriptSourceFiles = (cwd: string) => {
  // TODO: When sides are expanded read the `api` and `web` string instead
  // of hard-coding them.
  return glob.sync('{api,web}/src/**/*.{ts,tsx}', {
    cwd,
  })
}

/**
 * Read the contents of a TypeScript file, transpile it to JavaScript,
 * but leave the JSX intact and format via Prettier.
 *
 * @param {string} file - The path to the TypeScript file.
 */
export const transformTSToJS = (file: string) => {
  const tsCode = fs.readFileSync(file, 'utf8')
  const filename = path.basename(file)

  const result = transform(tsCode, {
    filename,
    cwd: getPaths().base,
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

  if (!result?.code) {
    return undefined
  }
  return prettify(result.code, filename.replace(/\.ts$/, '.js'))
}

export const prettierConfig = () => {
  try {
    return require(path.join(getPaths().base, 'prettier.config.js'))
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
export const prettify = (code: string, filename: string) => {
  const parser = prettierParser(filename)
  // Return unformatted code if we could not determine the parser.
  if (typeof parser === 'undefined') {
    return code
  }

  return format(code, {
    ...prettierConfig(),
    parser,
  })
}
