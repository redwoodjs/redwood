export const command = 'tailwindcss'

export const aliases = ['tailwind', 'tw']

export const description = 'Set up tailwindcss and PostCSS'

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
  const { handler } = await import('./tailwindcssHandler')
  return handler(options)
}
