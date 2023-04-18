import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'

export const command = 'studio'
export const description = 'Run the Redwood development studio'

export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#studio'
    )}`
  )
}

export const handler = async () => {
  try {
    // Import studio and start it
    const { start } = await import('@redwoodjs/studio')
    await start()
  } catch (e) {
    console.log('Cannot start the development studio')

    // If we don't have the package installed, install it for the user
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(
        'Installing the studio package for you, this may take a moment...'
      )
      await execa('yarn', ['add', '@redwoodjs/studio', '--dev'], {
        shell: true,
        cwd: getPaths().base,
      })
      console.log(
        'Studio package installed successfully, please execute the command again.'
      )
    } else {
      // Otherwise, log the error and exit
      console.log(e)
      process.exit(1)
    }
  }
}
