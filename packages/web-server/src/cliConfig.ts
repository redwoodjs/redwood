import type { Argv } from 'yargs'

import { getConfig } from '@redwoodjs/project-config'

import type { ParsedOptions } from './types'

export const description = 'Start a server for serving only the web side'

export function builder(yargs: Argv<ParsedOptions>) {
  yargs.options({
    port: {
      description: 'The port to listen on',
      type: 'number',
      alias: 'p',
      default: getConfig().web.port,
    },
    host: {
      description:
        "The host to listen on. Defaults to '0.0.0.0' in production, '::' in development",
      type: 'string',
      default: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    },

    apiUrl: {
      description:
        'Relative URL for proxying requests from or fully-qualified URL to the API server',
      type: 'string',
      alias: 'api-url',
      default: getConfig().web.apiUrl,
    },
    apiProxyTarget: {
      description:
        'Forward requests from the apiUrl to this host. apiUrl must be a relative URL',
      type: 'string',
      alias: 'api-proxy-target',
    },
    // Deprecated alias of `apiProxyTarget`
    apiHost: {
      description:
        '[Deprecated; use apiProxyTarget] Forward requests from the apiUrl to this host. apiUrl must be a relative URL',
      type: 'string',
      alias: 'api-host',
      deprecated: true,
    },
  })
}

export async function handler(options: ParsedOptions) {
  const { handler } = await import('./cliConfigHandler.js')
  await handler(options)
}
