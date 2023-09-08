import fs from 'fs'
import path from 'path'

import prompts from 'prompts'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import type { Args } from './setup'
import { notes, extraTask } from './setupData'
import {
  notes as webAuthnNotes,
  extraTask as webAuthnExtraTask,
  webPackages as webAuthnWebPackages,
  apiPackages as webAuthnApiPackages,
} from './webAuthn.setupData'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

export async function handler({ webauthn, force: forceArg }: Args) {
  const webAuthn = await shouldIncludeWebAuthn(webauthn)

  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'dbAuth',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-dbauth-api'",
    webAuthn,
    webPackages: [
      `@redwoodjs/auth-dbauth-web@${version}`,
      ...(webAuthn ? webAuthnWebPackages : []),
    ],
    apiPackages: [
      `@redwoodjs/auth-dbauth-api@${version}`,
      ...(webAuthn ? webAuthnApiPackages : []),
    ],
    extraTask: webAuthn ? webAuthnExtraTask : extraTask,
    notes: webAuthn ? webAuthnNotes : notes,
  })
}

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
