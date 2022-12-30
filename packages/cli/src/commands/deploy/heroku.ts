import yargs from 'yargs'

import { colors } from '../../lib'

import {
  createStep,
  predeployStep,
  pushStep,
  confirmationStep,
  createContextStep,
  addendumStep,
  createBoxen,
  writeStdout,
  type IYargs,
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
    describe: `Skip confirmation prompts and Nike... 'just do it'`,
    type: 'boolean',
    default: false,
  },
  debug: {
    describe: 'Extra information for debugging',
    type: 'boolean',
    default: false,
  },
  destroy: {
    describe: 'Destroy a created heroku app and all its resources',
    type: 'string',
    default: process.env.RWJS_CMD || '',
  },
}

export const builder = function (yargs: yargs.Argv): void {
  yargs.options(HEROKU_OPTIONS)
  return
}

type IHerokuStep = (ctx: IHerokuContext) => Promise<IHerokuContext>

const HEROKU_SETUP_STEPS: IHerokuStep[] = [
  confirmationStep,
  predeployStep,
  createStep,
  pushStep,
  addendumStep,
]

async function _runSteps(
  arr: IHerokuStep[],
  input: IHerokuContext
): Promise<IHerokuContext> {
  return arr.reduce(
    (promise: Promise<IHerokuContext>, fn: IHerokuStep) => promise.then(fn),
    Promise.resolve(input)
  )
}

export const handler = async (yargs: IYargs): Promise<void> => {
  try {
    writeStdout(
      createBoxen(colors.warning('Starting engines...'), '🚀 Heroku Deploy 🚀')
    )
    const ctx = await createContextStep(yargs)
    await _runSteps(HEROKU_SETUP_STEPS, ctx)
    writeStdout(createBoxen('All done!', '🚀'))
    return
  } catch (err: any) {
    console.error(colors.error(err.message))
    process.exit(1)
  }
}
