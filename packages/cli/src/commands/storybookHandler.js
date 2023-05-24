import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'

const redwoodProjectPaths = getPaths()

export const handler = ({
  build,
  buildDirectory,
  ci,
  open,
  port,
  smokeTest,
}) => {
  const cwd = redwoodProjectPaths.web.base
  const staticAssetsFolder = path.join(cwd, 'public')
  const execaOptions = {
    stdio: 'inherit',
    shell: true,
    cwd,
  }

  // Create the `MockServiceWorker.js` file. See https://mswjs.io/docs/cli/init.
  execa.command(`yarn msw init "${staticAssetsFolder}" --no-save`, execaOptions)

  const storybookConfigPath = path.dirname(
    require.resolve('@redwoodjs/testing/config/storybook/main.js')
  )

  /** @type {string?} */
  let command
  const flags = [`--config-dir "${storybookConfigPath}"`]

  if (build) {
    command = `yarn storybook build ${[
      ...flags,
      `--output-dir "${buildDirectory}"`,
    ]
      .filter(Boolean)
      .join(' ')}`
  } else if (smokeTest) {
    command = `yarn storybook dev ${[
      ...flags,
      `--port ${port}`,
      `--smoke-test`,
      `--ci`,
      `--no-version-updates`,
    ]
      .filter(Boolean)
      .join(' ')}`
  } else {
    command = `yarn storybook dev ${[
      ...flags,
      `--port ${port}`,
      `--no-version-updates`,
      ci && '--ci',
      !open && `--no-open`,
    ]
      .filter(Boolean)
      .join(' ')}`
  }

  try {
    execa.command(command, execaOptions)
  } catch (e) {
    console.log(c.error(e.message))
    errorTelemetry(process.argv, e.message)
    process.exit(1)
  }
}
