import path from 'path'

import camelcase from 'camelcase'
import Listr from 'listr'

import { getConfig } from '@redwoodjs/internal'

import { getPaths, writeFilesTask, transformTSToJS } from '../../../lib'
import c from '../../../lib/colors'
import {
  createYargsForComponentGeneration,
  templateForComponentFile,
} from '../helpers'

export const files = ({ name, typescript = false, tests }) => {
  if (tests === undefined) {
    tests = getConfig().generate.tests
  }

  const outputFilename = `${name}.${typescript ? 'ts' : 'js'}`

  const directiveFile = templateForComponentFile({
    name,
    extension: typescript ? '.ts' : '.js',
    generator: 'directive',
    templatePath: 'directive.ts.template',
    outputPath: path.join(getPaths().api.directives, outputFilename),
    templateVars: { camelName: camelcase(name) },
  })

  const files = [directiveFile]

  // @TODO: update test template!
  if (tests) {
    const testOutputFilename = `${name}.test.${typescript ? 'ts' : 'js'}`

    const testFile = templateForComponentFile({
      name,
      extension: typescript ? '.test.ts' : '.test.js',
      generator: 'directive',
      templatePath: 'directive.test.ts.template',
      outputPath: path.join(getPaths().api.directives, testOutputFilename),
      templateVars: { camelName: camelcase(name) },
    })
    files.push(testFile)
  }

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
