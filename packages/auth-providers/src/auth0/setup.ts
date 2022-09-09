import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'auth0'
export const description = 'Generate an auth configuration for Auth0'
export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  standardAuthHandler({
    basedir: __dirname,
    rwVersion,
    forceArg,
    provider: 'auth0',
    webPackages: ['@auth0/auth0-spa-js'],
    notes: [
      'You will need to create several environment variables with your Auth0 config options.',
      'Check out web/src/App.{js,tsx} for the variables you need to add.',
      'See: https://auth0.com/docs/quickstart/spa/react#get-your-application-keys',
      '\n',
      "You must also create an API and set the audience parameter, or you'll",
      'receive an opaque token instead of the required JWT token.',
      'See: https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api',
      '\n',
      'If you want to allow users to get refresh tokens while offline,',
      'you must also enable the Allow Offline Access switch in your',
      'Auth0 API Settings as part of setup configuration.',
      'See: https://auth0.com/docs/tokens/refresh-tokens',
      '\n',
      'You can increase security by using refresh token rotation which issues a new refresh token',
      'and invalidates the predecessor token with each request made to Auth0 for a new access token.',
      'Rotating the refresh token reduces the risk of a compromised refresh token.',
      'See: https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation',
    ],
  })
}
