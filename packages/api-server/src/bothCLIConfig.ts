import type { Argv } from 'yargs'

import type { BothParsedOptions } from './types'

export const description = 'Start a server for serving the api and web sides'

export function builder(yargs: Argv<BothParsedOptions>) {
  yargs.options({
    port: {
      description: 'The port to listen at',
      type: 'number',
      alias: 'p',
    },
    host: {
      description:
        "The host to listen at. Note that you most likely want this to be '0.0.0.0' in production",
      type: 'string',
    },
  })
}

export async function handler(options: BothParsedOptions) {
  const { handler } = await import('./bothCLIConfigHandler.js')
  await handler(options)
}
