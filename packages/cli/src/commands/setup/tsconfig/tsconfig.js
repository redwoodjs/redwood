export const command = 'tsconfig'

export const description = 'Set up tsconfig for web and api sides'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing tsconfig.json files',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./tsconfigHandler')
  return handler(options)
}
