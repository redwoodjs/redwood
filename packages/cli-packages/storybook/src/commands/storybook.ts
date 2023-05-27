import terminalLink from 'terminal-link'

import c from '../lib/colors'
import { StorybookYargsOptions } from '../types'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook: a tool for building UI components and pages in isolation'

export const defaultOptions: StorybookYargsOptions = {
  open: true,
  build: false,
  ci: false,
  port: 7910,
  buildDirectory: 'public/storybook',
  managerCache: true,
  smokeTest: false,
}

// TODO: Provide a type for the `yargs` argument
export const builder = (yargs: any) => {
  yargs
    .option('build', {
      describe: 'Build Storybook',
      type: 'boolean',
      default: defaultOptions.build,
    })
    .option('build-directory', {
      describe: 'Directory in web/ to store static files',
      type: 'string',
      default: defaultOptions.buildDirectory,
    })
    .option('ci', {
      describe: 'Start server in CI mode, with no interactive prompts',
      type: 'boolean',
      default: defaultOptions.ci,
    })
    .option('open', {
      describe: 'Open storybook in your browser on start',
      type: 'boolean',
      default: defaultOptions.open,
    })
    .option('port', {
      describe: 'Which port to run storybook on',
      type: 'integer',
      default: defaultOptions.port,
    })
    .option('smoke-test', {
      describe:
        "CI mode plus smoke-test (skip prompts; don't open browser; exit after successful start)",
      type: 'boolean',
      default: defaultOptions.smokeTest,
    })
    // TODO: Provide a type for the `argv` argument
    .check((argv: any) => {
      if (argv.build && argv.smokeTest) {
        throw new Error('Can not provide both "--build" and "--smoke-test"')
      }

      if (argv.build && argv.open) {
        console.warn(
          c.warning(
            'Warning: --open option has no effect when running Storybook build'
          )
        )
      }

      return true
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#storybook'
      )}`
    )
}

export const handler = async (options: StorybookYargsOptions) => {
  // NOTE: We should provide some visual output before the import to increase
  // the perceived performance of the command as there will be delay while we
  // load the handler.
  const { handler: storybookHandler } = await import('./storybookHandler.js')
  await storybookHandler(options)
}
