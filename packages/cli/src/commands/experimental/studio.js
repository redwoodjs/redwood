import terminalLink from 'terminal-link'

import { isModuleInstalled, installRedwoodModule } from '../../lib/packages'

export const command = 'studio'
export const description = 'Run the Redwood development studio'

export const builder = (yargs) => {
  yargs
    .option('open', {
      description:
        'If true, opens the studio in your default browser. Defaults to `true`',
      default: true,
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#studio'
      )}`
    )
}
export const handler = async (options) => {
  try {
    // Check the module is installed
    if (!isModuleInstalled('@redwoodjs/studio')) {
      console.log(
        'The studio package is not installed, installing it for you, this may take a moment...'
      )
      await installRedwoodModule('@redwoodjs/studio')
      console.log('Studio package installed successfully.')
    }

    // Import studio and start it
    const { start } = await import('@redwoodjs/studio')
    await start({ open: options.open })
  } catch (e) {
    console.log('Cannot start the development studio')
    console.log(e)
    process.exit(1)
  }
}
