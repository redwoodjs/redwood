import path from 'path'

import chalk from 'chalk'
import yargs from 'yargs'

import { getPaths } from '../../lib'

import {
  authStep,
  createStep,
  pushStep,
  validateSystemStep,
  prepareStep,
  createLogger,
  type IHerokuContext,
} from './modules/heroku'

export const command = 'heroku'
export const description = 'Setup and deploy to Heroku'

export const HEROKU_OPTIONS: { [keyof: string]: yargs.Options } = {
  'app-name': {
    describe: 'Use a custom name for your Heroku app',
    type: 'string',
    alias: 'a',
    default: '',
  },
  defaults: {
    describe: 'Use default values for all prompts',
    type: 'boolean',
    alias: 'd',
    default: false,
  },
  'skip-checks': {
    describe: 'Skip system checks',
    type: 'boolean',
    alias: 's',
    default: false,
  },
  delete: {
    describe: 'Manually delete an app by name',
    type: 'string',
    alias: 'D',
  },
  debug: {
    describe: 'Enable debug logging',
    type: 'boolean',
    default: false,
  },
}

export const builder = function (yargs: yargs.Argv) {
  yargs.options(HEROKU_OPTIONS)
}

type IHerokuStep = (ctx: IHerokuContext) => Promise<IHerokuContext>

const HEROKU_SETUP_STEPS: IHerokuStep[] = [
  validateSystemStep,
  prepareStep,
  authStep,
  createStep,
  pushStep,
]

async function _runSteps(arr: IHerokuStep[], input: IHerokuContext) {
  return arr.reduce(
    (promise: Promise<IHerokuContext>, fn: IHerokuStep) => promise.then(fn),
    Promise.resolve(input)
  )
}

export const handler = async (initCtx: IHerokuContext) => {
  try {
    const paths = getPaths()
    const app = path.basename(paths.base)
    const ctx = {
      ...initCtx,
      appName: initCtx.appName || app,
      projectPath: paths.base,
      logger: createLogger(initCtx.debug),
    }
    await _runSteps(HEROKU_SETUP_STEPS, ctx)
  } catch (err: any) {
    console.error(chalk.redBright(err.message))
    process.exit(1)
  }
}
