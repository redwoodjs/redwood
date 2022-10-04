import path from 'path'

import { Listr } from 'listr2'
import terminalLink from 'terminal-link'

import { getPaths, writeFilesTask, generateTemplate } from '../../../lib'
import c from '../../../lib/colors'
import { verifyModelName } from '../../../lib/schemaHelpers'
import { yargsDefaults } from '../../generate'

const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'model.js.template')

export const files = ({ name, typescript = false }) => {
  const outputFilename = `${name}.${typescript ? 'ts' : 'js'}`
  const outputPath = path.join(getPaths().api.models, outputFilename)

  return {
    [outputPath]: generateTemplate(TEMPLATE_PATH, { name }),
  }
}

export const command = 'model <name>'
export const description = 'Generate a RedwoodRecord model'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the model to create',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'RedwoodRecord Reference',
        'https://redwoodjs.com/docs/redwoodrecord'
      )}`
    )

  Object.entries(yargsDefaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}

export const handler = async ({ force, ...args }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating model file...',
        task: () => {
          return writeFilesTask(files(args), { overwriteExisting: force })
        },
      },
      {
        title: 'Parsing datamodel, generating api/src/models/index.js...',
        task: async () => {
          const { parseDatamodel } = await import('@redwoodjs/record')
          await parseDatamodel()
        },
      },
    ].filter(Boolean),
    { rendererOptions: { collapse: false } }
  )

  try {
    await verifyModelName({ name: args.name })
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(1)
  }
}
