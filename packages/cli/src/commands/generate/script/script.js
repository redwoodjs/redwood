import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import { paramCase } from 'param-case'
import terminalLink from 'terminal-link'

import { getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const POST_RUN_INSTRUCTIONS = `Next steps...\n\n   ${c.warning(
  'After writing your script, you can run it with:'
)}

     yarn rw run <name>
`

const TEMPLATE_PATH = path.resolve(
  __dirname,
  'templates',
  'script.js.template'
)

export const files = ({ name }) => {
  const outputFilename = `${paramCase(name)}.js`
  const outputPath = path.join(getPaths().api.scripts, outputFilename)

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
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface'
      )}`
    )
}

export const handler = async (args) => {
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
    console.log(c.error(e.message))
    process.exit(1)
  }
}
