import path from 'path'

import chalk from 'chalk'
import { config } from 'dotenv-defaults'

import { getPaths } from '@redwoodjs/project-config'

import { serveWeb } from './webServer'

// @ts-expect-error TODO
export async function handler(options) {
  if (!process.env.REDWOOD_ENV_FILES_LOADED) {
    config({
      path: path.join(getPaths().base, '.env'),
      defaults: path.join(getPaths().base, '.env.defaults'),
      multiline: true,
    })
  }

  try {
    chalk.dim('Starting web server...')
    await serveWeb(options)
  } catch (error) {
    process.exitCode ||= 1
    console.error(`Error: ${(error as Error).message}`)
  }
}
