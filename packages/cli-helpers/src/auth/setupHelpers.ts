import fs from 'fs'

import Listr from 'listr'
import prompts from 'prompts'
import terminalLink from 'terminal-link'
import yargs from 'yargs'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { colors } from '../lib/colors'
import { getPaths } from '../lib/paths'

import { files } from './authFiles'
import {
  addApiPackages,
  addAuthConfigToGqlApi,
  addAuthConfigToWeb,
  addWebPackages,
  generateAuthApi,
  installPackages,
  printNotes,
} from './authTasks'

/**
 * Check if one of the api side auth files already exists and if so, ask the
 * user to overwrite
 */
async function shouldForce(force: boolean, provider: string, webAuthn = false) {
  if (force) {
    return true
  }

  const existingFiles = Object.keys(files({ provider, webAuthn })).filter(
    (filePath) => fs.existsSync(filePath)
  )

  if (existingFiles.length > 0) {
    const shortPaths = existingFiles.map((filePath) =>
      filePath.replace(getPaths().base, '')
    )
    const forceResponse = await prompts({
      type: 'confirm',
      name: 'answer',
      message: `Overwrite existing ${shortPaths.join(', ')}?`,
      initial: false,
    })

    return forceResponse.answer
  }

  return false
}

export const standardAuthBuilder = (yargs: yargs.Argv) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
}

interface Args {
  rwVersion: string
  forceArg: boolean
  provider: string
  webAuthn?: boolean
  webPackages?: string[]
  apiPackages?: string[]
  extraTask?: Listr.ListrTask
  notes?: string[]
}

// from lodash
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T

function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}

export const standardAuthHandler = async ({
  rwVersion,
  forceArg,
  provider,
  webAuthn = false,
  webPackages = [],
  apiPackages = [],
  extraTask,
  notes,
}: Args) => {
  const force = await shouldForce(forceArg, provider, webAuthn)

  const tasks = new Listr(
    [
      generateAuthApi(provider, force, webAuthn),
      addAuthConfigToWeb(provider),
      addAuthConfigToGqlApi,
      addWebPackages(provider, webPackages, rwVersion),
      addApiPackages(provider, apiPackages),
      installPackages,
      extraTask,
      notes ? printNotes(notes) : null,
    ].filter(truthy),
    // @ts-expect-error: This option is widely used, so I guess it works...
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    if (isErrorWithMessage(e)) {
      errorTelemetry(process.argv, e.message)
      console.error(colors.error(e.message))
    }

    if (isErrorWithErrorCode(e)) {
      process.exit(e.exitCode || 1)
    } else {
      process.exit(1)
    }
  }
}

function isErrorWithMessage(e: any): e is { message: string } {
  return !!e.message
}

function isErrorWithErrorCode(e: any): e is { exitCode: number } {
  return !isNaN(e.exitCode)
}
