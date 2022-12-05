import yargs from 'yargs'

import {
  authStep,
  systemCheckStep,
  createStep,
  type IHerokuContext,
  copyTemplatesStep,
  createContextStep,
} from './modules/heroku'
import { pushStep } from './modules/heroku/push'
import { Logger } from './modules/heroku/stdio'

export const command = 'heroku'
export const description = 'Setup and deploy to Heroku'

export const HEROKU_OPTIONS: { [keyof: string]: yargs.Options } = {
  'app-name': {
    describe: 'Use a custom name for your Heroku app',
    type: 'string',
    default: '',
  },
  defaults: {
    describe: 'Use default values for all prompts',
    type: 'boolean',
    default: false,
  },
  'skip-checks': {
    describe: 'Skip system checks',
    type: 'boolean',
    default: false,
  },
}

export const builder = function (yargs: yargs.Argv) {
  Object.entries(HEROKU_OPTIONS).forEach(
    ([arg, opts]: [arg: string, opts: yargs.Options]) => yargs.option(arg, opts)
  )
}

type IHerokuStep = (ctx: IHerokuContext) => Promise<IHerokuContext>

const HEROKU_SETUP_STEPS: IHerokuStep[] = [
  systemCheckStep,
  createContextStep,
  authStep,
  copyTemplatesStep,
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
    await _runSteps(HEROKU_SETUP_STEPS, initCtx)
  } catch (err: any) {
    Logger.error(err.message)
  }
}
