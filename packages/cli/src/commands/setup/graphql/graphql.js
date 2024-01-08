import terminalLink from 'terminal-link'

import * as trustedDocumentsCommand from './features/trusted-documents'
export const command = 'graphql <feature>'
export const description = 'Set up GraphQL feature support'
export const builder = (yargs) =>
  yargs
    .command(trustedDocumentsCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-graphql'
      )}`
    )
