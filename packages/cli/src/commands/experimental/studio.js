import terminalLink from 'terminal-link'

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
    const { start } = await import('@redwoodjs/studio')
    await start({ open: options.open })
  } catch (e) {
    console.log('Error: Cannot start the development studio')
    console.log(e)
    process.exit(1)
  }
}
