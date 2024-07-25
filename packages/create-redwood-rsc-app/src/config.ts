// TODO: Really need to fix this, but I want to get this stuff merged first
// before I spend more time on it.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { parseArgs } from 'node:util'

export interface Config {
  installationDir: string
  verbose: boolean
}

export function initConfig() {
  const config: Config = {
    installationDir: '',
    verbose: false,
  }

  const { positionals, values } = parseArgs({
    options: {
      help: {
        short: 'h',
        type: 'boolean',
      },
      verbose: {
        short: 'v',
        type: 'boolean',
      },
      version: {
        short: 'V',
        type: 'boolean',
      },
    },
    strict: false,
  })

  if (values.verbose) {
    console.log('Parsed command line arguments:')
    console.log('    arguments:', values)
    console.log('    positionals:', positionals)
  }

  config.verbose = !!values.verbose
  config.installationDir = positionals[0]

  return config
}
