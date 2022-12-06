import fs from 'fs'
import path from 'path'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'auth0',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-auth0-api'",
    apiPackages: [`@redwoodjs/auth-auth0-api@${version}`],
    webPackages: [
      '@auth0/auth0-spa-js@1.22.5',
      `@redwoodjs/auth-auth0-web@${version}`,
    ],
    notes: [
      'You will need to create several environment variables with your Auth0 config options.',
      'Check out web/src/App.{js,tsx} for the variables you need to add.',
      'See: https://auth0.com/docs/quickstart/spa/react#get-your-application-keys',
      '',
      "You must also create an API and set the audience parameter, or you'll",
      'receive an opaque token instead of the required JWT token.',
      'See: https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api',
      '',
      'If you want to allow users to get refresh tokens while offline,',
      'you must also enable the Allow Offline Access switch in your',
      'Auth0 API Settings as part of setup configuration.',
      'See: https://auth0.com/docs/tokens/refresh-tokens',
      '',
      'You can increase security by using refresh token rotation which issues a new refresh token',
      'and invalidates the predecessor token with each request made to Auth0 for a new access token.',
      'Rotating the refresh token reduces the risk of a compromised refresh token.',
      'See: https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation',
    ],
  })
}
