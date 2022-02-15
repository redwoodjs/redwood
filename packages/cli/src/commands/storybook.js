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
    // .check((argv) => {
    //   if (argv.build && argv.smokeTest) {
    //     throw new Error('Can not provide both "--build" and "--smoke-test"')
    //   }
    //   if (argv.build && argv.open) {
    //     throw new Error('Can not provide both "--build" or "--open"')
    //   }
    //   return true
    // })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#storybook'
      )}`
    )
}

export const handler = ({
  open = true,
  port = 7910,
  build = false,
  buildDirectory = 'public/storybook',
  managerCache = true,
  smokeTest = false,
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

  // Case 1: yarn rw sb
  // run start-storybook
  // open in browser (default true)
  // set port (default 7910)
  // directory options are hard-coded
  //NOTE: `--no-manager-cache` option is only available for `start-storybook`

  if (open) {
    execa(
      `yarn start-storybook`,
      [
        `--config-dir "${storybookConfig}"`,
        `--port ${port}`,
        !managerCache && '--no-manager-cache',
      ].filter(Boolean),
      {
        stdio: 'inherit',
        shell: true,
        cwd,
      }
    )
  }

  // Case 2: yarn rw sb --build
  // build-directory option (default web/public/storybook)
  // directory for config is hard-coded
  // manager-cache option (default true)
  //NOTE: `--no-manager-cache` option is only available for `start-storybook`

  if (build) {
    execa(
      `yarn build-storybook`,
      [
        `--config-dir "${storybookConfig}"`,
        `--output-dir "${buildDirectory}"`,
        `--open=false`,
      ].filter(Boolean),
      {
        stdio: 'inherit',
        shell: true,
        cwd,
      }
    )
  }

  // Case 3: yarn rw sb --smoke-test
  // runs the start-storybook command; exits gracefully if started successful, throws otherwise
  // passes --smoke-test and --ci options
  try {
    if (smokeTest) {
      execa(
        `yarn start-storybook`,
        [
          `--config-dir "${storybookConfig}"`,
          `--port ${port}`,
          // !managerCache && '--no-manager-cache',
          `--smoke-test`,
          `--ci`,
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
