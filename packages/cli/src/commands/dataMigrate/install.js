import terminalLink from 'terminal-link'

export const command = 'install'
export const description = 'Add the RW_DataMigration model to your schema'

export function builder(yargs) {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#install'
    )}`
  )
}

export async function handler(options) {
  const { handler } = await import('./installHandler')
  return handler(options)
}
