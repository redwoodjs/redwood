import yargs from 'yargs'

import { type IYargsOptions } from './interfaces'

export const HEROKU_OPTIONS: IYargsOptions = {
  'skip-checks': {
    describe: 'Skip system and auth checks',
    type: 'boolean',
    default: false,
  },
  debug: {
    describe: 'Show errors and debug logs',
    type: 'boolean',
    default: false,
  },
  defaults: {
    describe: 'Use default values for all prompts',
    type: 'boolean',
    default: false,
  },
  nuke: {
    describe: 'Destroy the Heroku app after deployment',
    type: 'boolean',
    default: false,
  },
}

export function herokuBuilder(yargs: yargs.Argv) {
  Object.entries(HEROKU_OPTIONS).forEach(
    ([arg, opts]: [arg: string, opts: yargs.Options]) => yargs.option(arg, opts)
  )
}
