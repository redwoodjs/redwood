export const command = 'chakra-ui'
export const description = 'Set up Chakra UI'

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
}

export const handler = async (options) => {
  const { handler } = await import('./chakra-uiHandler')
  return handler(options)
}
