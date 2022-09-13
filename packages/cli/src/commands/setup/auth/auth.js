import terminalLink from 'terminal-link'

export const command = 'auth <provider>'

export const description = 'Generate an auth configuration'

export async function builder(yargs) {
  const {
    setupAuthAuth0Command,
    setupAuthAzureActiveDirectoryCommand,
    setupAuthClerkCommand,
    setupAuthCustomCommand,
    setupAuthDbAuthCommand,
    setupAuthEthereumCommand,
    setupAuthFirebaseCommand,
    setupAuthGoTrueCommand,
    setupAuthMagicLinkCommand,
    setupAuthNetlifyCommand,
    setupAuthNhostCommand,
    setupAuthOktaCommand,
    setupAuthSupabaseCommand,
    setupAuthSupertokensCommand,
  } = await import('@redwoodjs/auth-providers-setup')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )
    .command(setupAuthAuth0Command)
    .command(setupAuthAzureActiveDirectoryCommand)
    .command(setupAuthClerkCommand)
    .command(setupAuthCustomCommand)
    .command(setupAuthDbAuthCommand)
    .command(setupAuthEthereumCommand)
    .command(setupAuthFirebaseCommand)
    .command(setupAuthGoTrueCommand)
    .command(setupAuthMagicLinkCommand)
    .command(setupAuthNetlifyCommand)
    .command(setupAuthNhostCommand)
    .command(setupAuthOktaCommand)
    .command(setupAuthSupabaseCommand)
    .command(setupAuthSupertokensCommand)
}
