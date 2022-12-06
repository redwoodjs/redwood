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
    provider: 'azureActiveDirectory',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-azure-active-directory-api'",
    apiPackages: [`@redwoodjs/auth-azure-active-directory-api@${version}`],
    webPackages: [
      `@redwoodjs/auth-azure-active-directory-web@${version}`,
      '@azure/msal-browser',
    ],
    notes: [
      'You will need to create several environment variables with your Azure',
      'AD config options. Check out web/src/App.{js,tsx} for the variables',
      'you need to add.',
      '\n',
      'RedwoodJS specific Documentation:',
      'https://redwoodjs.com/docs/authentication#azure-ad',
      '\n',
      'MSAL.js Documentation:',
      'https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications',
    ],
  })
}
