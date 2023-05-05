export const command = 'jobs-inngest-function <name>'

export const description = 'Setup Inngest function flavorings'

export const builder = (yargs) => {
  yargs
    .positional('name', {
      type: 'string',
      description: 'Name of the function to setup',
    })
    .option('eventName', {
      aliases: ['e', 'event', 'eventName'],
      default: undefined,
      description:
        'Name of the event to trigger the function. Defaults to the function name.',
      type: 'string',
    })
    .option('graphql', {
      aliases: ['g', 'graphql', 'gql'],
      default: false,
      description: 'Build event name from your web side GraphQL operations',
      type: 'boolean',
    })
    .option('type', {
      alias: 't',
      type: 'string',
      choices: ['background', 'scheduled', 'delayed', 'step'],
      description: 'Type of Inngest function to setup',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
}

export const handler = async (options) => {
  console.debug('inngestFunction.js handler() options:', options)
  const { handler } = await import('./inngestFunctionHandler')
  return handler(options)
}
