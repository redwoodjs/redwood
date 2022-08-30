import terminalLink from 'terminal-link'

import detectRwVersion from '../middleware/detectProjectRwVersion'

export const command = 'setup <command>'

export const description = 'Initialize project config and install packages'

export async function builder(yargs) {
  const setupAuthCommand = await import('./setup/auth/auth')
  const setupCustomWebIndexCommand = await import(
    './setup/custom-web-index/custom-web-index'
  )
  const setupGeneratorCommand = await import('./setup/generator/generator')
  const setupGraphiqlCommand = await import('./setup/graphiql/graphiql')
  const setupI18nCommand = await import('./setup/i18n/i18n')
  const setupTSConfigCommand = await import('./setup/tsconfig/tsconfig')
  const setupUICommand = await import('./setup/ui/ui')
  const setupWebpackCommand = await import('./setup/webpack/webpack')

  yargs
    .demandCommand()
    .middleware(detectRwVersion)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup'
      )}`
    )
    .command(setupAuthCommand)
    .command(setupCustomWebIndexCommand)
    .command(setupGeneratorCommand)
    .command(setupGraphiqlCommand)
    .command(setupI18nCommand)
    .command(setupTSConfigCommand)
    .command(setupUICommand)
    .command(setupWebpackCommand)
}
