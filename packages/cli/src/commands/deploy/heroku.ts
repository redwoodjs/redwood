import { Listr, ListrContext } from 'listr2'
import yargs from 'yargs'

import {
  Logger,
  setupHeroku,
  checkSystemRequirements,
  type IYargs,
  type IYargsOptions,
  type IListrContext,
} from './modules/heroku'

// chck for windows ✅
// check if heroku is installed  ✅
// login to heroku ✅
// create project with desired opts
// configure config files in project
// deploy to heroku
// add commands to passthrough heroku cli

export const command = 'heroku'
export const description = 'Setup Heroku deployment'

export const HEROKU_OPTIONS: IYargsOptions = {
  init: {
    describe: 'Initialize heroku deploy',
    type: 'string',
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

export const builder = (yargs: yargs.Argv) => {
  Object.entries(HEROKU_OPTIONS).forEach(
    ([arg, opts]: [arg: string, opts: yargs.Options]) => yargs.option(arg, opts)
  )
}

export const handler = async (yargs: IYargs) => {
  const logger = new Logger(yargs.debug)
  try {
    const tasks = new Listr<ListrContext>(HEROKU_TASKS, {
      concurrent: false,
      exitOnError: true,
      renderer: 'default',
      rendererOptions: {
        collapse: false,
        clearOutput: false,
        showSubtasks: true,
        collapseErrors: false,
        showTimer: true,
        showErrorMessage: true,
        showSkipMessage: true,
      },
    })
    const runArgs: IListrContext = { logger, ...yargs }
    await tasks.run(runArgs)
  } catch (err) {
    console.log('Exited with errors. use --debug to see more info')
    logger.error(err)
  }
}
