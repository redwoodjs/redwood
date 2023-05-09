import { getEpilogue } from './util'

export const command = 'server-file'

export const description = 'Setup the experimental server file'

export const EXPERIMENTAL_TOPIC_ID = 4851

export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Print more logs',
      type: 'boolean',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export const handler = async (options) => {
  const { handler } = await import('./serverFileHandler')
  return handler(options)
}
