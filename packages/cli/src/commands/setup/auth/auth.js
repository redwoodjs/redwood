import fs from 'fs'
import path from 'path'

import terminalLink from 'terminal-link'

const getSupportedProviders = () =>
  fs
    .readdirSync(path.resolve(__dirname, 'providers'))
    .map((file) => path.basename(file, '.js'))
    .filter((file) => file !== 'README.md')

export const command = 'auth <provider>'
export const description = 'Generate an auth configuration'
export const builder = (yargs) => {
  yargs
    .positional('provider', {
      choices: getSupportedProviders(),
      description: 'Auth provider to configure',
      type: 'string',
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

export const handler = async (options) => {
  const { handler } = await import('./authHandler')
  return handler(options)
}
