import path from 'path'

import camelcase from 'camelcase'
import execa from 'execa'
import { Listr } from 'listr2'
import prompts from 'prompts'

import { getConfig } from '@redwoodjs/internal/dist/config'

import { getPaths, writeFilesTask, transformTSToJS } from '../../../lib'
import c from '../../../lib/colors'
import { yargsDefaults } from '../../generate'
import {
  createYargsForComponentGeneration,
  templateForComponentFile,
} from '../helpers'

export const files = ({ name, typescript = false, type, tests }) => {
  if (tests === undefined) {
    tests = getConfig().generate.tests
  }

  if (!type) {
    throw new Error('You must specify a directive type')
  }

  const camelName = camelcase(name)

  const outputFilename = `${camelName}.${typescript ? 'ts' : 'js'}`

  const directiveFile = templateForComponentFile({
    name,
    extension: typescript ? '.ts' : '.js',
    generator: 'directive',
    templatePath: `${type}.directive.ts.template`,
    outputPath: path.join(getPaths().api.directives, camelName, outputFilename),
    templateVars: { camelName },
  })

  const files = [directiveFile]

  if (tests) {
    const testOutputFilename = `${camelcase(name)}.test.${
      typescript ? 'ts' : 'js'
    }`

    const testFile = templateForComponentFile({
      name,
      extension: typescript ? '.test.ts' : '.test.js',
      generator: 'directive',
      templatePath: `${type}.directive.test.ts.template`,
      outputPath: path.join(
        getPaths().api.directives,
        camelName,
        testOutputFilename
      ),
      templateVars: { camelName },
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
    optionsObj: {
      ...yargsDefaults,
      type: {
        type: 'string',
        choices: ['validator', 'transformer'],
        description: 'Whether to generate a validator or transformer directive',
      },
    },
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

  let directiveType = args.type

  // Prompt to select what type if not specified
  if (!directiveType) {
    const response = await prompts({
      type: 'select',
      name: 'directiveType',
      choices: [
        {
          value: 'validator',
          title: 'Validator',
          description:
            'Implement a validation: throw an error if criteria not met to stop execution',
        },
        {
          value: 'transformer',
          title: 'Transformer',
          description: 'Modify values of fields or query responses',
        },
      ],
      message: 'What type of directive would you like to generate?',
    })

    directiveType = response.directiveType
  }

  const tasks = new Listr(
    [
      {
        title: 'Generating directive file ...',
        task: () => {
          return writeFilesTask(files({ ...args, type: directiveType }), {
            overwriteExisting: args.force,
          })
        },
      },
      {
        title: 'Generating TypeScript definitions and GraphQL schemas ...',
        task: () => {
          return execa('yarn rw-gen', [], {
            stdio: 'pipe',
            shell: true,
          })
        },
      },
      {
        title: 'Next steps...',
        task: (_ctx, task) => {
          task.title = POST_RUN_INSTRUCTIONS
        },
      },
    ].filter(Boolean),
    { rendererOptions: { collapse: false } }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
