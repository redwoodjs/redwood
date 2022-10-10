import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import {
  Listr,
  ListrTaskWrapper,
  ListrRenderer,
  ListrGetRendererClassFromValue,
} from 'listr2'
import { format } from 'prettier'

import { colors } from './colors'
import { getPaths } from './paths'

// TODO: Move this into `generateTemplate` when all templates have TS support
/*
 * Convert a generated TS template file into JS.
 */
export const transformTSToJS = (filename: string, content: string) => {
  if (!content) {
    return content
  }

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
    console.error(colors.error(`Could not transform ${filename} to JS`))

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
): string => {
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

export const writeFile = <Renderer extends typeof ListrRenderer>(
  target: string,
  contents: string,
  { overwriteExisting = false } = {},
  // TODO: Remove type cast
  task: ListrTaskWrapper<never, Renderer> = {} as ListrTaskWrapper<
    never,
    Renderer
  >
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
export const writeFilesTask = <Renderer extends typeof ListrRenderer>(
  files: Record<string, string>,
  options: { overwriteExisting: boolean }
) => {
  const { base } = getPaths()

  return new Listr(
    Object.keys(files).map((file) => {
      const contents = files[file]

      return {
        title: `...waiting to write file \`./${path.relative(base, file)}\`...`,
        task: (
          _ctx: never,
          task: ListrTaskWrapper<
            never,
            ListrGetRendererClassFromValue<Renderer>
          >
        ) => {
          return writeFile(file, contents, options, task)
        },
      }
    })
  )
}
