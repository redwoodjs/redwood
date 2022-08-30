import terminalLink from 'terminal-link'

export const command = 'ui <library>'

export const description = 'Set up a UI design or style library'

export async function builder(yargs) {
  const setupUIChakraUICommand = await import('./libraries/chakra-ui')
  const setupUIMantineCommand = await import('./libraries/mantine')
  const setupUITailwindCSSCommand = await import('./libraries/tailwindcss')
  const setupUIWindiCSSCommand = await import('.//libraries/windicss')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-ui'
      )}`
    )
    .command(setupUIChakraUICommand)
    .command(setupUIMantineCommand)
    .command(setupUITailwindCSSCommand)
    .command(setupUIWindiCSSCommand)
}
