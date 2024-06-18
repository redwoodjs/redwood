import fs from 'fs'
import path from 'path'

import prompts from 'prompts'

import { getGraphqlPath, standardAuthHandler } from '@redwoodjs/cli-helpers'

import type { Args } from './setup'
import { notes, extraTask, createUserModelTask, hasModel } from './setupData'
import {
  notes as webAuthnNotes,
  extraTask as webAuthnExtraTask,
  webPackages as webAuthnWebPackages,
  apiPackages as webAuthnApiPackages,
} from './webAuthn.setupData'

export async function handler({
  webauthn,
  createUserModel,
  force: forceArg,
}: Args) {
  const { version } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'),
  )

  const webAuthn = await shouldIncludeWebAuthn(webauthn)
  const createDbUserModel = await shouldCreateUserModel(createUserModel)

  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'dbAuth',
    authDecoderImport:
      "import { createAuthDecoder } from '@redwoodjs/auth-dbauth-api'",
    webAuthn,
    webPackages: [
      `@redwoodjs/auth-dbauth-web@${version}`,
      ...(webAuthn ? webAuthnWebPackages : []),
    ],
    apiPackages: [
      `@redwoodjs/auth-dbauth-api@${version}`,
      ...(webAuthn ? webAuthnApiPackages : []),
    ],
    extraTasks: [
      webAuthn ? webAuthnExtraTask : extraTask,
      createDbUserModel ? createUserModelTask : undefined,
      createAuthDecoderFunction,
    ],
    notes: webAuthn ? webAuthnNotes : notes,
  })
}

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to enable WebAuthn support
 */
async function shouldIncludeWebAuthn(webauthn: boolean | null) {
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

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to create a User model in their Prisma schema
 */
async function shouldCreateUserModel(createUserModel: boolean | null) {
  if (createUserModel === null && !hasModel('User')) {
    const createModelResponse = await prompts({
      type: 'confirm',
      name: 'answer',
      message: 'Create User model?',
      initial: false,
    })

    return createModelResponse.answer
  }

  return createUserModel
}

export const createAuthDecoderFunction = {
  title: 'Create auth decoder function',
  task: () => {
    const graphqlPath = getGraphqlPath()

    if (!graphqlPath) {
      throw new Error('Could not find your graphql file path')
    }

    const authDecoderCreation =
      'const authDecoder = createAuthDecoder(cookieName)'

    const content = fs.readFileSync(graphqlPath, 'utf-8')

    let newContent = content.replace(
      'import { getCurrentUser } from',
      'import { cookieName, getCurrentUser } from',
    )

    const authDecoderCreationRegexp = new RegExp(
      '^' + escapeRegExp(authDecoderCreation),
      'm',
    )

    if (!authDecoderCreationRegexp.test(newContent)) {
      newContent = newContent.replace(
        'export const handler = createGraphQLHandler({',
        authDecoderCreation +
          '\n\n' +
          'export const handler = createGraphQLHandler({',
      )
    }

    if (!newContent.includes('import { cookieName')) {
      throw new Error('Failed to import cookieName')
    }

    fs.writeFileSync(graphqlPath, newContent)
  },
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
