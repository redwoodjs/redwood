export const command = 'custom-web-index'

export const description =
  'Set up a custom index.js file, so you can customize how Redwood web is mounted in your browser'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing index.js file',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./custom-web-indexHandler')
  return handler(options)
}
