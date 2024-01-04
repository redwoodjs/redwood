import terminalLink from 'terminal-link'

export const command = 'graphql <feature>'
export const description = 'Set up GraphQL feature support'
export const builder = (yargs) =>
  yargs
    .commandDir('./features')
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-graphql'
      )}`
    )
