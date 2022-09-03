import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/internal/dist/paths'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'

export function handler({
  open,
  port,
  build,
  ci,
  buildDirectory,
  managerCache,
  smokeTest,
}) {
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
          ci && '--ci',
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
