import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import omit from 'lodash/omit'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import c from '../../lib/colors'

import { deployBuilder, deployHandler } from './helpers/helpers'

export const command = 'edgio [...commands]'
export const description = 'Build command for Edgio deploy'

export const builder = async (yargs) => {
  const { builder: edgioBuilder } = require('@edgio/cli/commands/deploy')
  deployBuilder(yargs)

  edgioBuilder['skip-init'] = {
    type: 'boolean',
    description: [
      'Edgio will attempt to initialize your project before deployment.',
      'If your project has already been initialized and you wish to skip',
      'this step, set this to `true`',
    ].join(' '),
    default: false,
  }

  yargs
    // allow Edgio CLI options to pass through
    .options(edgioBuilder)
    .group(
      Object.keys(omit(edgioBuilder, ['skip-init'])),
      'Edgio deploy options:'
    )
}

const execaOptions = {
  cwd: path.join(getPaths().base),
  shell: true,
  stdio: 'inherit',
  cleanup: true,
}

export const handler = async (args) => {
  const { builder: edgioBuilder } = require('@edgio/cli/commands/deploy')
  const cwd = path.join(getPaths().base)

  try {
    // check that Edgio is setup in the project
    await execa('yarn', ['edgio', '--version'], execaOptions)
  } catch (e) {
    logAndExit(ERR_MESSAGE_MISSING_CLI)
  }

  // check that the project has been already been initialized.
  // if not, we will run init automatically unless specified by arg
  const configExists = await fs.pathExists(path.join(cwd, 'edgio.config.js'))

  if (!configExists) {
    if (args.skipInit) {
      logAndExit(ERR_MESSAGE_NOT_INITIALIZED)
    }

    await execa('yarn', ['edgio', 'init'], execaOptions)
  }

  await deployHandler(args)

  // construct args for deploy command
  const deployArgs = Object.keys(edgioBuilder).reduce((acc, key) => {
    if (args[key]) {
      acc.push(`--${key}=${args[key]}`)
    }
    return acc
  }, [])

  // Even if rw builds the project, we still need to run the build for Edgio
  // to bundle the router so we just skip the framework build.
  //
  //    --skip-framework (edgio build):
  //      skips the framework build, but bundles the router and
  //      assets for deployment
  //
  //    --skip-build (edgio deploy):
  //      skips the whole build process during deploy; user may
  //      opt out of this if they already did a build and just
  //      want to deploy

  // User must explicitly pass `--skip-build` during deploy in order to
  // skip bundling the router.
  if (!args.skipBuild) {
    deployArgs.push('--skip-build')
    await execa('yarn', ['edgio', 'build', '--skip-framework'], execaOptions)
  }

  await execa('yarn', ['edgio', 'deploy', ...deployArgs], execaOptions)
}

export const ERR_MESSAGE_MISSING_CLI = buildErrorMessage(
  'Edgio not found!',
  [
    'It looks like Edgio is not configured for your project.',
    'Run the following to add Edgio to your project:',
    `  ${c.info('yarn add -D @edgio/cli')}`,
  ].join('\n')
)

export const ERR_MESSAGE_NOT_INITIALIZED = buildErrorMessage(
  'Edgio not initialized!',
  [
    'It looks like Edgio is not configured for your project.',
    'Run the following to initialize Edgio on your project:',
    `  ${c.info('yarn edgio init')}`,
  ].join('\n')
)

export function buildErrorMessage(title, message) {
  return [
    c.bold(c.error(title)),
    '',
    message,
    '',
    `Also see the ${terminalLink(
      'RedwoodJS on Edgio Guide',
      'https://docs.edg.io/guides/redwoodjs'
    )} for additional resources.`,
    '',
  ].join('\n')
}

function logAndExit(message) {
  console.log(message)
  process.exit(1)
}
