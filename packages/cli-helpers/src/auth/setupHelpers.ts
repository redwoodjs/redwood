import { Listr, ListrTask } from 'listr2'
import terminalLink from 'terminal-link'
import yargs from 'yargs'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { colors } from '../lib/colors'

import {
  addApiPackages,
  addAuthConfigToGqlApi,
  addConfigToRoutes,
  addConfigToWebApp,
  addWebPackages,
  AuthGeneratorCtx,
  checkIfAuthSetupAlready,
  createWebAuth,
  generateAuthApiFiles,
  installPackages,
} from './authTasks'

export const standardAuthBuilder = (yargs: yargs.Argv) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Log setup output',
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
  extraTask?: ListrTask<AuthGeneratorCtx>
  notes?: string[]
  verboseArg?: boolean
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
  verboseArg,
}: Args) => {
  // @TODO detect if auth already setup. If it is, ask how to proceed:
  // How would you like to proceed?
  // 1. Replace existing auth provider with <provider>
  // 2. Combine providers ~~ NOT SUPPORTED YET ~~

  const tasks = new Listr<AuthGeneratorCtx, 'verbose' | 'default'>(
    [
      checkIfAuthSetupAlready(),
      generateAuthApiFiles(setupTemplateDir, webAuthn),

      // Setup the web side
      addConfigToWebApp(), // Add the config to the app
      createWebAuth(setupTemplateDir, webAuthn),
      addConfigToRoutes(),
      // ----=----

      addAuthConfigToGqlApi(authDecoderImport), // Update api/src/functions/gql function
      addWebPackages(webPackages, rwVersion),
      addApiPackages(apiPackages),
      installPackages,
      extraTask,
      notes && {
        title: 'One more thing...',
        task: (ctx: AuthGeneratorCtx) => {
          // Can't console.log the notes here because of
          // https://github.com/cenk1cenk2/listr2/issues/296
          // So we do it after the tasks have all finished instead
          if (ctx.shouldReplaceExistingProvider) {
            notes.push(
              `\n Your existing auth provider has been replaced, but please remember to remove any old packages, config and functions that are not used by ${ctx.provider} auth`
            )
          }
        },
      },
    ].filter(truthy),
    {
      rendererOptions: { collapse: false },
      ctx: {
        shouldReplaceExistingProvider: forceArg,
        provider, // provider name passed from CLI
      },
      renderer: verboseArg ? 'verbose' : 'default',
    }
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
