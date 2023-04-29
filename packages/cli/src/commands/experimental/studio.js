import terminalLink from 'terminal-link'

export const command = 'studio'
export const description = 'Run the Redwood development studio'

export function builder(yargs) {
  yargs
    .option('open', {
      default: true,
      description: 'Open the studio in your browser',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#studio'
      )}`
    )
}

export async function handler(options) {
  const { handler } = await import('./studioHandler')
  return handler(options)
}
