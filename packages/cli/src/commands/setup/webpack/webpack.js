export const command = 'webpack'
export const description =
  'Set up webpack in your project so you can add custom config'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./webpackHandler')
  return handler(options)
}
