export const command = 'mantine'
export const description = 'Set up Mantine UI'

const ALL_KEYWORD = 'all'

export function builder(yargs) {
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
  yargs.option('packages', {
    alias: 'p',
    default: ['core', 'hooks'],
    description: `Mantine packages to install. Specify '${ALL_KEYWORD}' to install all packages. Default: ['core', 'hooks']`,
    type: 'array',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./mantineHandler')
  return handler(options)
}
