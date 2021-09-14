import path from 'path'

import fse from 'fs-extra'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { getPaths } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'generator <name>'
export const description =
  'Copies generator templates locally for customization'

const SIDE_MAP = {
  web: ['cell', 'component', 'layout', 'page', 'scaffold'],
  api: ['function', 'sdl', 'service'],
}

const copyGenerator = (name, { force }) => {
  const side = SIDE_MAP['web'].includes(name) ? 'web' : 'api'
  const from = path.join(__dirname, '..', name, 'templates')
  const to = path.join(getPaths()[side].generators, name)

  // copy template files to appropriate side in app
  fse.copySync(from, to, { overwrite: force, errorOnExist: true })

  return to
}

// This could be built using createYargsForComponentGeneration;
// however, functions wouldn't have a `stories` option. createYargs...
// should be reversed to provide `yargsDefaults` as the default configuration
// and accept a configuration such as its CURRENT default to append onto a command.
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the generator to copy templates from',
      choices: [
        'cell',
        'component',
        'function',
        'layout',
        'page',
        'scaffold',
        'script',
        'sdl',
        'service',
      ],
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-function'
      )}`
    )
}

let destination

const tasks = ({ name, force }) => {
  return new Listr(
    [
      {
        title: 'Copying generator templates...',
        task: () => {
          destination = copyGenerator(name, { force })
        },
      },
      {
        title: 'Destination:',
        task: (ctx, task) => {
          task.title = `  Wrote templates to ${destination.replace(
            getPaths().base,
            ''
          )}`
        },
      },
    ],
    { collapse: false, errorOnExist: true }
  )
}

export const handler = async ({ name, force }) => {
  const t = tasks({ name, force })

  try {
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
