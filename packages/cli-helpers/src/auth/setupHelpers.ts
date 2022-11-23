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
async function shouldOverwriteApiSideFiles(
  force: boolean,
  basedir: string,
  webAuthn: boolean
) {
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
  setupTemplateDir: string
  rwVersion: string
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

/**
 *  setupTemplateDir assumes that you must have a templates folder in that directory.
 *
 *  See folder structure of auth providers in packages/auth-providers-setup/src/<provider>
 *
 */
export const standardAuthHandler = async ({
  setupTemplateDir,
  rwVersion,
  forceArg,
  provider,
  authDecoderImport,
  webAuthn = false,
  webPackages = [],
  apiPackages = [],
  extraTask,
  notes,
}: Args) => {
  // @MARK this is our problem. Should force only checks for api side files,
  // not for web side files
  const forceApiSide = await shouldOverwriteApiSideFiles(
    forceArg,
    setupTemplateDir,
    webAuthn
  )

  // @TODO detect if auth already setup. If it is, ask how to proceed:
  // How would you like to proceed?
  // 1. Replace existing auth provider with <provider>
  // 2. Combine providers ~~ NOT SUPPORTED YET ~~

  const tasks = new Listr<never>(
    [
      generateAuthApiFiles(setupTemplateDir, provider, forceApiSide, webAuthn),

      // @MARK remove this function below
      addAuthConfigToWeb(setupTemplateDir, provider, webAuthn),
      /**  @MARK replace it with these smalelr steps
      addConfigToApp() // Add the config to the app
      createWebAuth(basedir, provider, webAuthn) // Add the web/src/auth.ts file
      addConfigToRoutes()
      */
      addAuthConfigToGqlApi(authDecoderImport),
      addWebPackages(webPackages, rwVersion),
      addApiPackages(apiPackages),
      installPackages,
      extraTask,
      notes && {
        title: 'One more thing...',
        task: () => {
          // Can't console.log the notes here because of
          // https://github.com/cenk1cenk2/listr2/issues/296
          // So we do it after the tasks have all finished instead
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
