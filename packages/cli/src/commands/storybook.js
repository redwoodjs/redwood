import terminalLink from 'terminal-link'

import c from '../lib/colors'

export const command = 'storybook'
export const aliases = ['sb']
export const description =
  'Launch Storybook: a tool for building UI components and pages in isolation'

export const builder = (yargs) => {
  yargs
    .option('open', {
      describe: 'Open storybooks in your browser on start',
      type: 'boolean',
      default: true,
    })
    .option('build', {
      describe: 'Build Storybook',
      type: 'boolean',
      default: false,
    })
    .option('ci', {
      describe: 'Start server in CI mode, with no interactive prompts',
      type: 'boolean',
      default: false,
    })
    .option('port', {
      describe: 'Which port to run storybooks on',
      type: 'integer',
      default: 7910,
    })
    .option('build-directory', {
      describe: 'Directory in web/ to store static files',
      type: 'string',
      default: 'public/storybook',
    })
    .option('manager-cache', {
      describe:
        "Cache the manager UI. Disable this when you're making changes to `storybook.manager.js`.",
      type: 'boolean',
      default: true,
    })
    .option('smoke-test', {
      describe:
        "CI mode plus Smoke-test (skip prompts, don't open browser, exit after successful start)",
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

export const handler = async (options) => {
  const { handler } = await import('./storybookHandler')
  return handler(options)
}
