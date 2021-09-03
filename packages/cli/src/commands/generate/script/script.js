import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/internal'
import { getProject } from '@redwoodjs/structure'

import { getPaths, writeFilesTask } from '../../../lib'
import c from '../../../lib/colors'

const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'script.js.template')

export const files = ({ name, typescript = false }) => {
  const outputFilename = `${name}.${typescript ? 'ts' : 'js'}`
  const outputPath = path.join(getPaths().scripts, outputFilename)

  return {
    [outputPath]: fs.readFileSync(TEMPLATE_PATH).toString(),
  }
}

export const command = 'script <name>'
export const description = 'Generate a command line script'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'A descriptor of what this script does',
      type: 'string',
    })
    .option('typescript', {
      alias: 'ts',
      description:
        'Generate TypeScript file. Enabled by default if we detect your project is TypeScript',
      type: 'boolean',
      default: getProject().isTypeScriptProject,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface'
      )}`
    )
}

export const handler = async (args) => {
  const POST_RUN_INSTRUCTIONS = `Next steps...\n\n   ${c.warning(
    'After modifying your script, you can invoke it like:'
  )}

     yarn rw exec ${args.name}

     yarn rw exec ${args.name} --param1 true
`

  const tasks = new Listr(
    [
      {
        title: 'Generating script file...',
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
    errorTelemetry(process.argv, e.message)
    console.log(c.error(e.message))
    process.exit(1)
  }
}
