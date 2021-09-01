import fs from 'fs'
import path from 'path'

import camelcase from 'camelcase'
import Listr from 'listr'

import { getPaths, writeFilesTask, transformTSToJS } from '../../../lib'
import c from '../../../lib/colors'
import {
  createYargsForComponentGeneration,
  templateForComponentFile,
} from '../helpers'

const TEMPLATE_PATH = path.resolve(
  __dirname,
  'templates',
  'directive.ts.template'
)

export const files = ({ name, typescript = false }) => {
  const outputFilename = `${name}.${typescript ? 'ts' : 'js'}`

  const directiveFile = templateForComponentFile({
    name,
    extension: typescript ? '.ts' : '.js',
    generator: 'directive',
    templatePath: 'directive.ts.template',
    outputPath: path.join(getPaths().api.directives, outputFilename),
    templateVars: { camelName: camelcase(name) },
  })

  // const testFile = templateForComponentFile({
  //   name,
  //   suffix: COMPONENT_SUFFIX,
  //   extension: typescript ? '.test.tsx' : '.test.js',
  //   webPathSection: REDWOOD_WEB_PATH_NAME,
  //   generator: 'page',
  //   templatePath: 'test.tsx.template',
  //   templateVars: rest,
  // })

  const files = [directiveFile]

  // if (tests) {
  //   files.push(testFile)
  // }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    const template = typescript ? content : transformTSToJS(outputPath, content)

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

const positionalsObj = {
  name: {
    description: 'Name of your directive',
    type: 'string',
  },
}

export const { command, description, builder } =
  createYargsForComponentGeneration({
    componentName: 'directive',
    filesFn: files,
    positionalsObj,
  })

export const handler = async (args) => {
  const POST_RUN_INSTRUCTIONS = `Next steps...\n\n   ${c.warning(
    'After modifying your directive, you can add it to your SDLs e.g.:'
  )}
    ${c.info('// example todo.sdl.js')}
    ${c.info('# Option A: Add it to a field')}
    type Todo {
      id: Int!
      body: String! ${c.green(`@${args.name}`)}
    }

    ${c.info('# Option B: Add it to query/mutation')}
    type Query {
      todos: [Todo] ${c.green(`@${args.name}`)}
    }
`

  const tasks = new Listr(
    [
      {
        title: 'Generating directive file...',
        task: () => {
          return writeFilesTask(files(args), { overwriteExisting: args.force })
        },
      },
      {
        title: 'Next steps...',
        task: (_ctx, task) => {
          task.title = POST_RUN_INSTRUCTIONS
        },
      },
    ].filter(Boolean),
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
