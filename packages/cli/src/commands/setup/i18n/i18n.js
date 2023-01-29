export const command = 'i18n'
export const description = 'Set up i18n'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./i18nHandler')
  return handler(options)
}
