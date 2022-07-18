import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/internal'

import c from '../../lib/colors'

import { deployBuilder, deployHandler } from './helpers/helpers'

export const command = 'fly [...commands]'
export const description = 'Deploy to Fly.io'

export const builder = async (yargs) => {
  deployBuilder(yargs)
}

const execaOptions = {
  cwd: path.join(getPaths().base),
  shell: true,
  stdio: 'inherit',
  cleanup: true,
}

export const handler = async (args) => {
  const cwd = path.join(getPaths().base)

  try {
    // check that flyctl is setup in the project
    await execa('flyctl', ['version'], execaOptions)
  } catch (e) {
    logAndExit(ERR_MESSAGE_MISSING_CLI)
  }

  // check that the project has been already been initialized.
  // if not, we will run init automatically unless specified by arg
  const configExists = await fs.pathExists(path.join(cwd, 'fly.toml'))

  if (!configExists) {
    await execa('flyctl', ['launch'], execaOptions)
  }

  await deployHandler(args)

  await execa('flyctl', ['deploy', '--remote-only'], execaOptions)
}

export const ERR_MESSAGE_MISSING_CLI = buildErrorMessage(
  'flyctl not found!',
  [
    'First install flyctl by following instructions here: https://fly.io/docs/flyctl/installing',
  ].join('\n')
)

export const ERR_MESSAGE_NOT_INITIALIZED = buildErrorMessage(
  'This app is not setup for deployment on Fly.io!',
  [
    "It looks like your project hasn't been setup for deployment on Fly.io.",
    "Run this to get started - you'll be asked a few questions.",
    `  ${c.green('flyctl launch')}`,
  ].join('\n')
)

export const ERR_MESSAGE_NOT_AUTHED = buildErrorMessage(
  'You need to setup a Fly.io account!',
  [
    "It looks like you aren't logged in to a Fly.io account.",
    `Run this to signup to Fly.io. To run apps on the Fly.io free tier, you may need to enter a credit card.`,
    `  ${c.green('flyctl auth signup')}`,
  ].join('\n')
)

export function buildErrorMessage(title, message) {
  return [
    c.bold(c.error(title)),
    '',
    message,
    '',
    `Also see the ${terminalLink(
      'RedwoodJS on Fly.io Guide',
      'https://fly.io/docs/getting-started/redwood'
    )} for additional resources.`,
    '',
  ].join('\n')
}

function logAndExit(message) {
  console.log(message)
  process.exit(1)
}
