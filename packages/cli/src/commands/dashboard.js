import terminalLink from 'terminal-link'

export const command = 'dashboard'
export const description = 'Run the Redwood development dashboard'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#info'
    )}`
  )
}
export const handler = async () => {
  try {
    const { start } = await import('@redwoodjs/dashboard')
    await start()
  } catch (e) {
    console.log('Error: Cannot start the development dashboard')
    console.log(e)
    process.exit(1)
  }
}
