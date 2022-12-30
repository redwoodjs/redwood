import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import omit from 'lodash/omit'
import terminalLink from 'terminal-link'

import { colors as c, getPaths } from '../../lib'
import { deployBuilder, deployHandler } from '../deploy'

export const command = 'layer0 [...commands]'
export const description = 'Build command for Layer0 deploy'

export const builder = async (yargs) => {
  const { builder: layer0Builder } = require('@layer0/cli/commands/deploy')
  deployBuilder(yargs)

  layer0Builder['skip-init'] = {
    type: 'boolean',
    description: [
      'Layer0 will attempt to initialize your project before deployment.',
      'If your project has already been initialized and you wish to skip',
      'this step, set this to `true`',
    ].join(' '),
    default: false,
  }

  yargs
    // allow Layer0 CLI options to pass through
    .options(layer0Builder)
    .group(
      Object.keys(omit(layer0Builder, ['skip-init'])),
      'Layer0 deploy options:'
    )
}

const execaOptions = {
  cwd: path.join(getPaths().base),
  shell: true,
  stdio: 'inherit',
  cleanup: true,
}

export const handler = async (args) => {
  const { builder: layer0Builder } = require('@layer0/cli/commands/deploy')
  const cwd = path.join(getPaths().base)

  try {
    // check that Layer0 is setup in the project
    await execa('yarn', ['layer0', '--version'], execaOptions)
  } catch (e) {
    logAndExit(ERR_MESSAGE_MISSING_CLI)
  }

  // check that the project has been already been initialized.
  // if not, we will run init automatically unless specified by arg
  const configExists = await fs.pathExists(path.join(cwd, 'layer0.config.js'))

  if (!configExists) {
    if (args.skipInit) {
      logAndExit(ERR_MESSAGE_NOT_INITIALIZED)
    }

    await execa('yarn', ['layer0', 'init'], execaOptions)
  }

  await deployHandler(args)

  // construct args for deploy command
  const deployArgs = Object.keys(layer0Builder).reduce((acc, key) => {
    if (args[key]) {
      acc.push(`--${key}=${args[key]}`)
    }
    return acc
  }, [])

  // Even if rw builds the project, we still need to run the build for Layer0
  // to bundle the router so we just skip the framework build.
  //
  //    --skip-framework (layer0 build):
  //      skips the framework build, but bundles the router and
  //      assets for deployment
  //
  //    --skip-build (layer0 deploy):
  //      skips the whole build process during deploy; user may
  //      opt out of this if they already did a build and just
  //      want to deploy

  // User must explicitly pass `--skip-build` during deploy in order to
  // skip bundling the router.
  if (!args.skipBuild) {
    deployArgs.push('--skip-build')
    await execa('yarn', ['layer0', 'build', '--skip-framework'], execaOptions)
  }

  await execa('yarn', ['layer0', 'deploy', ...deployArgs], execaOptions)
}

export const ERR_MESSAGE_MISSING_CLI = buildErrorMessage(
  'Layer0 not found!',
  [
    'It looks like Layer0 is not configured for your project.',
    'Run the following to add Layer0 to your project:',
    `  ${c.info('yarn add -D @layer0/cli')}`,
  ].join('\n')
)

export const ERR_MESSAGE_NOT_INITIALIZED = buildErrorMessage(
  'Layer0 not initialized!',
  [
    'It looks like Layer0 is not configured for your project.',
    'Run the following to initialize Layer0 on your project:',
    `  ${c.info('yarn layer0 init')}`,
  ].join('\n')
)

export function buildErrorMessage(title, message) {
  return [
    c.bold(c.error(title)),
    '',
    message,
    '',
    `Also see the ${terminalLink(
      'RedwoodJS on Layer0 Guide',
      'https://docs.layer0.co/guides/redwoodjs'
    )} for additional resources.`,
    '',
  ].join('\n')
}

function logAndExit(message) {
  console.log(message)
  process.exit(1)
}
