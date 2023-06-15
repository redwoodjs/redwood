import path from 'node:path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'
// @ts-expect-error Allow the import of an untyped package.
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'
import { StorybookYargsOptions } from '../types'

export async function handler({
  build,
  buildDirectory,
  ci,
  open,
  port,
  smokeTest,
}: StorybookYargsOptions) {
  const cwd = getPaths().web.base
  const staticAssetsFolder = path.join(cwd, 'public')
  const execaOptions: Partial<execa.Options> = {
    stdio: 'inherit',
    shell: true,
    cwd,
  }

  // Create the `MockServiceWorker.js` file. See https://mswjs.io/docs/cli/init.
  await execa.command(
    `yarn msw init "${staticAssetsFolder}" --no-save`,
    execaOptions
  )

  const storybookConfigPath = path.dirname(
    require.resolve('@redwoodjs/testing/config/storybook/main.js')
  )

  let command = ''
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
    await execa.command(command, execaOptions)
  } catch (e) {
    console.log(c.error((e as Error).message))
    errorTelemetry(process.argv, (e as Error).message)
    process.exit(1)
  }
}
