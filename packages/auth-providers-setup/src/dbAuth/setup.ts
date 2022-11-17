import prompts from 'prompts'
import terminalLink from 'terminal-link'
import yargs from 'yargs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { notes, extraTask } from './setupData'
import {
  notes as webAuthnNotes,
  extraTask as webAuthnExtraTask,
  webPackages as webAuthnWebPackages,
  apiPackages as webAuthnApiPackages,
} from './webAuthn.setupData'

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to enable WebAuthn support
 */
async function shouldIncludeWebAuthn(webauthn: boolean) {
  if (webauthn === null) {
    const webAuthnResponse = await prompts({
      type: 'confirm',
      name: 'answer',
      message: `Enable WebAuthn support (TouchID/FaceID)? See https://redwoodjs.com/docs/auth/dbAuth#webAuthn`,
      initial: false,
    })

    return webAuthnResponse.answer
  }

  return webauthn
}

export const command = 'dbAuth'
export const description = 'Generate an auth configuration for dbAuth'
export const builder = (yargs: yargs.Argv) => {
  yargs
    .option('warn', {
      default: true,
      description: 'Experimental auth warning',
      type: 'boolean',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('webauthn', {
      alias: 'w',
      default: null,
      description: 'Include WebAuthn support (TouchID/FaceID)',
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
  webauthn: boolean
  force: boolean
}

export const handler = async ({
  rwVersion,
  webauthn,
  force: forceArg,
}: Args) => {
  const webAuthn = await shouldIncludeWebAuthn(webauthn)

  standardAuthHandler({
    basedir: __dirname,
    rwVersion,
    forceArg,
    provider: 'dbAuth',
    authDecoderImport:
      "import { dbAuthAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    webAuthn,
    webPackages: webAuthn
      ? webAuthnWebPackages
      : ['@redwoodjs/auth-providers-web'],
    apiPackages: webAuthn
      ? webAuthnApiPackages
      : ['@redwoodjs/auth-providers-api'],
    extraTask: webAuthn ? webAuthnExtraTask : extraTask,
    notes: webAuthn ? webAuthnNotes : notes,
  })
}
