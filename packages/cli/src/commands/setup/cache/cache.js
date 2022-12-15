import terminalLink from 'terminal-link'

export const command = 'cache <client>'

export const description = 'Sets up an init file for service caching'

export const builder = (yargs) => {
  yargs
    .positional('client', {
      choices: ['memcached', 'redis'],
      description: 'Cache client',
      type: 'string',
      required: true,
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing cache.js file',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-cache'
      )}`
    )
}

export const handler = async (options) => {
  const { handler } = await import('./cacheHandler')
  return handler(options)
}
