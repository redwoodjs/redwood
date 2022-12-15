import terminalLink from 'terminal-link'

import { supportedProviders } from './supportedProviders'

export const command = 'graphiql <provider>'
export const description = 'Generate GraphiQL headers'
export const builder = (yargs) => {
  yargs
    .positional('provider', {
      choices: Object.keys(supportedProviders),
      description: 'Auth provider used',
      type: 'string',
    })
    .option('id', {
      alias: 'i',
      description: 'Unique id to identify current user',
      type: 'string',
    })
    .option('token', {
      alias: 't',
      description:
        'Generated JWT token. If not provided, mock JWT payload is provided that can be modified and turned into a token',
      type: 'string',
    })
    .option('expiry', {
      alias: 'e',
      default: 60,
      description: 'Token expiry in minutes. Default is 60',
      type: 'number',
    })
    .option('view', {
      alias: 'v',
      default: false,
      description: 'Print out generated headers',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-header'
      )}`
    )
}

export const handler = async (options) => {
  const { handler } = await import('./graphiqlHandler')
  return handler(options)
}
