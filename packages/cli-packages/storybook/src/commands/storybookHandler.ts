import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import type { ExecaError } from 'execa'
import execa from 'execa'
import semver from 'semver'

import { BundlerEnum, getConfig, getPaths } from '@redwoodjs/project-config'
// Allow import of untyped package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'
import type { StorybookYargsOptions } from '../types'

export async function handler({
  build,
  buildDirectory,
  ci,
  open,
  port,
  smokeTest,
}: StorybookYargsOptions) {
  // Notice to vite users to try `yarn rw storybook-vite`. This will eventually be the default
  // once we have removed webpack. Until then we give a small nudge to vite users to try it out.
  if (getConfig().web.bundler === BundlerEnum.VITE) {
    console.log(
      c.bold(
        `\nIt looks like you're using vite, please try:\n\n  yarn rw storybook-vite\n\nThis will run storybook using vite which should be a much nicer experience for you.\nYou can find out more at: https://community.redwoodjs.com/t/7212\n\n`
      )
    )
  }

  // We add a stub file to type generation because users don't have Storybook
  // installed when they first start a project. We need to remove the file once
  // they install Storybook so that the real types come through.
  fs.rmSync(
    path.join(getPaths().generated.types.includes, 'web-storybook.d.ts'),
    { force: true }
  )

  // Check for conflicting options
  if (build && smokeTest) {
    throw new Error('Can not provide both "--build" and "--smoke-test"')
  }

  if (build && open) {
    console.warn(
      c.warning(
        'Warning: --open option has no effect when running Storybook build'
      )
    )
  }

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
  const flags = [
    `--config-dir "${storybookConfigPath}"`,
    '--webpack-stats-json',
  ]

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

  const env: Record<string, string> = {}

  if (
    semver.parse(process.version) !== null &&
    semver.lt(process.version, '22.0.0') &&
    semver.gte(process.version, '20.19.0')
  ) {
    env.NODE_OPTIONS = '--no-experimental-require-module'
  }

  try {
    await execa.command(command, { ...execaOptions, env })
  } catch (e) {
    if ((e as ExecaError).signal !== 'SIGINT') {
      console.log(c.error((e as Error).message))
      errorTelemetry(process.argv, (e as Error).message)
    }
    process.exit((e as ExecaError).exitCode ?? 1)
  }
}
