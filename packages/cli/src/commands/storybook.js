import terminalLink from 'terminal-link'

import c from '../lib/colors'

export const command = 'storybook'
export const aliases = ['sb']

export const description =
  'Launch Storybook: a tool for building UI components in isolation'

export function builder(yargs) {
  yargs
    .option('build', {
      describe: 'Build Storybook',
      type: 'boolean',
      default: false,
    })
    .option('build-directory', {
      describe: 'Directory in web/ to store static files',
      type: 'string',
      default: 'public/storybook',
    })
    .option('ci', {
      describe: 'Start server in CI mode, with no interactive prompts',
      type: 'boolean',
      default: false,
    })
    .option('open', {
      describe: 'Open storybook in your browser on start',
      type: 'boolean',
      default: true,
    })
    .option('port', {
      describe: 'Which port to run storybook on',
      type: 'integer',
      default: 7910,
    })
    .option('smoke-test', {
      describe:
        "CI mode plus smoke-test (skip prompts; don't open browser; exit after successful start)",
      type: 'boolean',
      default: false,
    })
    .check((argv) => {
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

export async function handler(options) {
  const { handler } = await import('./storybookHandler')
  await handler(options)
}
