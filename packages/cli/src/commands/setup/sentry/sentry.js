import terminalLink from 'terminal-link'

export const command = 'sentry'

export const description = 'Support Sentry error and performance tracking'

export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing sentry.js files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'http://localhost:3000/docs/cli-commands#setup-sentry'
      )}`
    )
}

export const handler = async (options) => {
  const { handler } = await import('./sentryHandler')
  return handler(options)
}
