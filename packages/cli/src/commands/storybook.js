import path from 'path'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/internal'
import { errorTelemetry } from '@redwoodjs/telemetry'

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
        'https://redwoodjs.com/reference/command-line-interface#storybook'
      )}`
    )
}

export const handler = ({
  open,
  port,
  build,
  buildDirectory,
  managerCache,
  smokeTest,
}) => {
  const cwd = getPaths().web.base

  const staticAssetsFolder = path.join(getPaths().web.base, 'public')
  // Create the `MockServiceWorker.js` file
  // https://mswjs.io/docs/cli/init
  execa(`yarn msw init "${staticAssetsFolder}" --no-save`, undefined, {
    stdio: 'inherit',
    shell: true,
    cwd,
  })

  const storybookConfig = path.dirname(
    require.resolve('@redwoodjs/testing/config/storybook/main.js')
  )

  try {
    if (build) {
      execa(
        `yarn build-storybook`,
        [
          `--config-dir "${storybookConfig}"`,
          `--output-dir "${buildDirectory}"`,
          !managerCache && `--no-manager-cache`,
        ].filter(Boolean),
        {
          stdio: 'inherit',
          shell: true,
          cwd,
        }
      )
    } else if (smokeTest) {
      execa(
        `yarn start-storybook`,
        [
          `--config-dir "${storybookConfig}"`,
          `--port ${port}`,
          `--smoke-test`,
          `--ci`,
          `--no-version-updates`,
        ].filter(Boolean),
        {
          stdio: 'inherit',
          shell: true,
          cwd,
        }
      )
    } else {
      execa(
        `yarn start-storybook`,
        [
          `--config-dir "${storybookConfig}"`,
          `--port ${port}`,
          !managerCache && `--no-manager-cache`,
          `--no-version-updates`,
          !open && `--no-open`,
        ].filter(Boolean),
        {
          stdio: 'inherit',
          shell: true,
          cwd,
        }
      )
    }
  } catch (e) {
    console.log(c.error(e.message))
    errorTelemetry(process.argv, e.message)
    process.exit(1)
  }
}
