export const command = 'windicss'

export const aliases = ['windi']

export const description = 'Set up WindiCSS'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })

  yargs.option('install', {
    alias: 'i',
    default: true,
    description: 'Install packages',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./windicssHandler')
  return handler(options)
}
