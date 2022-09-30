import prompts from 'prompts'
import terminalLink from 'terminal-link'

import c from '../../../lib/colors'

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

  // Don't forget to update test-project setup if you change something here
  const printExperimentalWarning = async (argv, yargs) => {
    if (!argv.warn) {
      return
    }

    console.log(
      c.warning(
        [
          '',
          'This version of auth is experimental. After running this command',
          'you will not be able to downgrade to a stable version of Redwood',
          'without breaking your auth setup. Please only use this version of',
          'auth in throwaway projects',
          '',
        ].join('\n')
      )
    )
    const response = await prompts({
      type: 'confirm',
      name: 'answer',
      message: 'Do you want to continue?',
      initial: false,
    })

    if (!response.answer) {
      yargs.exit(1)
    }
  }

  yargs
    .middleware([printExperimentalWarning])
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
