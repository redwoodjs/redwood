import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import Listr from 'listr'
import { memoize } from 'lodash'
import { format } from 'prettier'

import {
  getPaths as getRedwoodPaths,
  resolveFile as internalResolveFile,
} from '@redwoodjs/internal/dist/paths'

import c from './colors'

export function isErrorWithMessage(e: any): e is { message: string } {
  return !!e.message
}

/**
 * This wraps the core version of getPaths into something that catches the exception
 * and displays a helpful error message.
 */
export const _getPaths = () => {
  try {
    return getRedwoodPaths()
  } catch (e) {
    if (isErrorWithMessage(e)) {
      console.error(c.error(e.message))
    }

    process.exit(1)
  }
}

export const getPaths = memoize(_getPaths)
export const resolveFile = internalResolveFile

export const getGraphqlPath = () => {
  return resolveFile(path.join(getPaths().api.functions, 'graphql'))
}

export const graphFunctionDoesExist = () => {
  const graphqlPath = getGraphqlPath()
  return graphqlPath && fs.existsSync(graphqlPath)
}

// TODO: Move this into `generateTemplate` when all templates have TS support
/*
 * Convert a generated TS template file into JS.
 */
export const transformTSToJS = (filename: string, content: string) => {
  const babelFileResult = babel.transform(content, {
    filename,
    // If you ran `yarn rw generate` in `./web` transformSync would import the `.babelrc.js` file,
    // in `./web`? despite us setting `configFile: false`.
    cwd: process.env.NODE_ENV === 'test' ? undefined : getPaths().base,
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

  if (!babelFileResult?.code) {
    console.error(c.error(`Could not transform ${filename} to JS`))

    process.exit(1)
  }

  return prettify(filename.replace(/\.tsx?$/, '.js'), babelFileResult.code)
}

/**
 * This returns the config present in `prettier.config.js` of a Redwood project.
 */
export const prettierOptions = () => {
  try {
    return require(path.join(getPaths().base, 'prettier.config.js'))
  } catch (e) {
    return undefined
  }
}

export const prettify = (
  templateFilename: string,
  renderedTemplate: string
) => {
  // We format .js and .css templates, we need to tell prettier which parser
  // we're using.
  // https://prettier.io/docs/en/options.html#parser
  const parser = {
    '.css': 'css',
    '.js': 'babel',
    '.ts': 'babel-ts',
    '.tsx': 'babel-ts',
  }[path.extname(templateFilename.replace('.template', ''))]

  if (typeof parser === 'undefined') {
    return renderedTemplate
  }

  return format(renderedTemplate, {
    ...prettierOptions(),
    parser,
  })
}

export const writeFile = (
  target: string,
  contents: string,
  { overwriteExisting = false } = {},
  task: Listr.ListrTaskWrapper = {} as Listr.ListrTaskWrapper // TODO: Remove type cast
) => {
  const { base } = getPaths()
  task.title = `Writing \`./${path.relative(base, target)}\``
  if (!overwriteExisting && fs.existsSync(target)) {
    throw new Error(`${target} already exists.`)
  }

  const filename = path.basename(target)
  const targetDir = target.replace(filename, '')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(target, contents)
  task.title = `Successfully wrote file \`./${path.relative(base, target)}\``
}

/**
 * Creates a list of tasks that write files to the disk.
 *
 * @param files - {[filepath]: contents}
 */
export const writeFilesTask = (
  files: Record<string, string>,
  options: { overwriteExisting: boolean }
) => {
  const { base } = getPaths()
  return new Listr(
    Object.keys(files).map((file) => {
      const contents = files[file]

      return {
        title: `...waiting to write file \`./${path.relative(base, file)}\`...`,
        task: (_ctx: Listr.ListrContext, task: Listr.ListrTaskWrapper) => {
          return writeFile(file, contents, options, task)
        },
      }
    })
  )
}
