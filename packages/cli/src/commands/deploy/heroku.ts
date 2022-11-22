import { Listr, ListrContext, ListrRenderer, ListrTaskWrapper } from 'listr2'

import { setupHeroku, checkSystemRequirements } from './modules/heroku'
import { Logger } from './modules/heroku/logger'

// chck for windows
// check if heroku is installed, if not, install
// login to heroku
// create project with desired opts
// configure config files in project
// deploy to heroku
// add commands to passthrough heroku cli

export const command = 'heroku'
export const description = 'Setup Heroku deployment'

export const HEROKU_OPTIONS = {
  init: {
    describe: 'Initialize heroku deploy',
    type: 'init',
    default: false,
  },
  cmd: {
    describe: 'Pass through command to heroku cli',
    type: 'string',
    default: '',
  },
  debug: {
    describe: 'Show errors and debug logs',
    type: 'boolean',
    default: false,
  },
}

export type TaskWrapper = ListrTaskWrapper<ListrContext, typeof ListrRenderer>

export const HEROKU_TASKS = [
  {
    title: 'Checking prerequisites',
    task: checkSystemRequirements,
  },
  {
    title: 'Setting up Heroku',
    task: setupHeroku,
  },
]

export const builder = (yargs: any) => {
  Object.entries(HEROKU_OPTIONS).forEach(([arg, opts]) =>
    yargs.option(arg, opts)
  )
}

export const handler = async (yargs: any) => {
  const logger = new Logger(yargs.debug)
  try {
    const tasks = new Listr(HEROKU_TASKS, {
      concurrent: false,
      exitOnError: true,
    })
    await tasks.run({ logger, ...yargs })
  } catch (err) {
    console.log('Exited with errors. use --debug to see more info')
    logger.error(err)
  }
}
