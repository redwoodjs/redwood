import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import { paramCase } from 'param-case'
import terminalLink from 'terminal-link'

import { getPaths, writeFilesTask } from '../../../lib'
import c from '../../../lib/colors'

const POST_RUN_INSTRUCTIONS = `Next steps...\n\n   ${c.warning(
  'After writing your migration, you can run it with:'
)}

     yarn rw dataMigrate up
`

const TEMPLATE_PATH = path.resolve(
  __dirname,
  'templates',
  'dataMigration.js.template'
)

export const files = ({ name }) => {
  const now = new Date().toISOString()
  const timestamp = now.split('.')[0].replace(/\D/g, '')
  const outputFilename = `${timestamp}-${paramCase(name)}.js`
  const outputPath = path.join(getPaths().api.dataMigrations, outputFilename)

  return {
    [outputPath]: fs.readFileSync(TEMPLATE_PATH).toString(),
  }
}

export const command = 'dataMigration <name>'
export const description = 'Generate a data migration'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'A descriptor of what this data migration does',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-auth'
      )}`
    )
}

export const handler = async (args) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating data migration file...',
        task: () => {
          return writeFilesTask(files(args))
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
