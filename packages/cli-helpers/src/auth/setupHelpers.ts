import fs from 'fs'

import { Listr, ListrTask } from 'listr2'
import prompts from 'prompts'
import terminalLink from 'terminal-link'
import yargs from 'yargs'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { colors } from '../lib/colors'
import { getPaths } from '../lib/paths'

import { apiSideFiles } from './authFiles'
import {
  addApiPackages,
  addAuthConfigToGqlApi,
  addAuthConfigToWeb,
  addWebPackages,
  generateAuthApiFiles,
  installPackages,
} from './authTasks'

/**
 * Check if one of the api side auth files already exists and if so, ask the
 * user to overwrite
 */
async function shouldForce(force: boolean, basedir: string, webAuthn: boolean) {
  if (force) {
    return true
  }

  const existingFiles = Object.keys(apiSideFiles({ basedir, webAuthn })).filter(
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
  return yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('warn', {
      default: true,
      description: 'Show experimental auth warning',
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
  basedir: string
  forceArg: boolean
  provider: string
  authDecoderImport?: string
  webAuthn?: boolean
  webPackages?: string[]
  apiPackages?: string[]
  extraTask?: ListrTask<never>
  notes?: string[]
}

// from lodash
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T

function truthy<T>(value: T): value is Truthy<T> {
  return !!value
}

export const standardAuthHandler = async ({
  basedir,
  forceArg,
  provider,
  authDecoderImport,
  webAuthn = false,
  webPackages = [],
  apiPackages = [],
  extraTask,
  notes,
}: Args) => {
  const force = await shouldForce(forceArg, basedir, webAuthn)

  const tasks = new Listr<never>(
    [
      generateAuthApiFiles(basedir, provider, force, webAuthn),
      addAuthConfigToWeb(basedir, provider, webAuthn),
      addAuthConfigToGqlApi(authDecoderImport),
      webPackages.length && addWebPackages(webPackages),
      apiPackages.length && addApiPackages(apiPackages),
      (webPackages.length || apiPackages.length) && installPackages,
      extraTask,
      notes && {
        title: 'One more thing...',
        task: () => {
          // Can't console.log the notes here because of
          // https://github.com/cenk1cenk2/listr2/issues/296.
          // So we do it after the tasks have all finished instead.
        },
      },
    ].filter(truthy),
    { rendererOptions: { collapse: false } }
  )

  try {
    await tasks.run()
    notes && console.log(`\n   ${notes.join('\n   ')}\n`)
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
