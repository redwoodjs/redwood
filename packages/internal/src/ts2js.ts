import fs from 'fs'
import path from 'path'

import { transform } from '@babel/core'
import fg from 'fast-glob'
import { readJSONSync, writeJSONSync } from 'fs-extra'
import { format } from 'prettier'

import { getPaths } from './paths'

/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
export const convertTsProjectToJs = (cwd = getPaths().base) => {
  const files = typeScriptSourceFiles(cwd)
  convertTsFilesToJs(cwd, files)
}

/**
 * Converts all the TypeScript files in `scripts` to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
export const convertTsScriptsToJs = (cwd = getPaths().base) => {
  const files = typeScriptSourceFiles(cwd, 'scripts/*.{ts,tsx}')
  convertTsFilesToJs(cwd, files)
}

/**
 * Converts TypeScript files to JavaScript.
 *
 * @param {string} cwd - Current directory
 * @param {string[]} files - Collection of files to convert
 */
export const convertTsFilesToJs = (cwd: string, files: string[]) => {
  if (files.length === 0) {
    console.log('No TypeScript files found to convert to JS in this project.')
  }

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
}

/**
 * @param {string} cwd
 */
export function convertTsConfigsToJsConfigs(cwd = getPaths().base) {
  const tsConfigs = [
    'api/tsconfig.json',
    'web/tsconfig.json',
    'scripts/tsconfig.json',
  ]

  tsConfigs
    .filter((tsConfig) => fs.existsSync(path.join(cwd, tsConfig)))
    .map((tsConfig) => readJSONSync(path.join(cwd, tsConfig)))
    .map(convertTsConfigToJsConfig)
    .forEach((jsConfig, i) => {
      writeJSONSync(
        path.join(cwd, tsConfigs[i].replace('tsconfig', 'jsconfig')),
        jsConfig
      )
    })
}

function convertTsConfigToJsConfig(tsConfig: any) {
  delete tsConfig.compilerOptions.allowJs
  return tsConfig
}

/**
 * Get all the source code from a Redwood project
 */
export const typeScriptSourceFiles = (
  cwd: string,
  globPattern = '{api,web}/src/**/*.{ts,tsx}'
) => {
  console.log(globPattern)
  // TODO: When sides are expanded read the `api` and `web` string instead
  // of hard-coding them.
  return fg.sync(globPattern, {
    cwd,
    ignore: ['node_modules'],
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
