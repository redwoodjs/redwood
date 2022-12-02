import prompts from 'prompts'
import terminalLink from 'terminal-link'

import c from '../../../lib/colors'

export const command = 'auth <provider>'

export const description = 'Generate an auth configuration'

export async function builder(yargs) {
  const {
    setupAuthClerkCommand,
    setupAuthDbAuthCommand,
    setupAuthEthereumCommand,
    setupAuthGoTrueCommand,
    setupAuthMagicLinkCommand,
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
          "You're running the experimental @canary version of auth. It might",
          'be broken, and after running this command you will not be able to',
          'downgrade to a stable version of Redwood without breaking your',
          'auth setup. Please only use this version of auth in throwaway',
          'projects. For a more stable experience, but still updated with the',
          "latest patches, try switching to Redwood's @next version by",
          'running `yarn rw upgrade -t next`',
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

  const setupAuthCommand = yargs
    .middleware([printExperimentalWarning])
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-auth'
      )}`
    )

    .command(setupAuthClerkCommand)
    .command(setupAuthDbAuthCommand)
    .command(setupAuthEthereumCommand)
    .command(setupAuthGoTrueCommand)
    .command(setupAuthMagicLinkCommand)
    .command(setupAuthNhostCommand)
    .command(setupAuthOktaCommand)
    .command(setupAuthSupabaseCommand)
    .command(setupAuthSupertokensCommand)

  async function addSetupCommand(module, namedExport) {
    let commandModule

    try {
      commandModule = await import(module)
    } catch (e) {
      // Since these are plugins, it's ok if they can't be imported because they're not installed.
      if (e.code === 'MODULE_NOT_FOUND') {
        return
      }
      throw e
    }

    if (commandModule) {
      setupAuthCommand.command(commandModule[namedExport])
    }
  }

  for (const [module, namedExport] of [
    ['@redwoodjs/auth-auth0-setup', 'setupAuthAuth0Command'],
    [
      '@redwoodjs/auth-azure-active-directory-setup',
      'setupAuthAzureActiveDirectoryCommand ',
    ],
    ['@redwoodjs/auth-custom-setup', 'setupAuthCustomCommand'],
    ['@redwoodjs/auth-netlify-setup', 'setupAuthNetlifyCommand'],
    ['@redwoodjs/auth-firebase-setup', 'setupAuthFirebaseCommand'],
  ]) {
    await addSetupCommand(module, namedExport)
  }
}
