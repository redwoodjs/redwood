import fs from 'fs'
import path from 'path'

import fse from 'fs-extra'
import { Listr } from 'listr2'
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
const EXCLUDE_GENERATORS = [
  'dataMigration',
  'dbAuth',
  'generator',
  'script',
  'secret',
]

const copyGenerator = (name, { force }) => {
  const side = SIDE_MAP['web'].includes(name) ? 'web' : 'api'
  const from = path.join(__dirname, '../../generate', name, 'templates')
  const to = path.join(getPaths()[side].generators, name)

  // copy entire template directory contents to appropriate side in app
  fse.copySync(from, to, { overwrite: force, errorOnExist: true })

  return to
}

// This could be built using createYargsForComponentGeneration;
// however, functions wouldn't have a `stories` option. createYargs...
// should be reversed to provide `yargsDefaults` as the default configuration
// and accept a configuration such as its CURRENT default to append onto a command.
export const builder = (yargs) => {
  const availableGenerators = fs
    .readdirSync(path.join(__dirname, '../../generate'), {
      withFileTypes: true,
    })
    .filter((dir) => dir.isDirectory() && !dir.name.match(/__/))
    .map((dir) => dir.name)

  yargs
    .positional('name', {
      description: 'Name of the generator to copy templates from',
      choices: availableGenerators.filter(
        (dir) => !EXCLUDE_GENERATORS.includes(dir)
      ),
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
        'https://redwoodjs.com/docs/cli-commands#setup-generator'
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
    { rendererOptions: { collapse: false }, errorOnExist: true }
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
