import chalk from 'chalk'

import { redwoodFastifyWeb, coerceRootPath } from '@redwoodjs/fastify-web'
import { getConfig } from '@redwoodjs/project-config'

import { getWebHost, getWebPort } from './cliHelpers'
import createFastifyInstance from './fastify'
import { redwoodFastifyAPI } from './plugins/api'
import type { BothParsedOptions } from './types'

export async function handler(options: BothParsedOptions) {
  const timeStart = Date.now()
  console.log(chalk.dim.italic('Starting API and Web Servers...'))

  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  const fastify = createFastifyInstance()
  fastify.register(redwoodFastifyWeb)
  fastify.register(redwoodFastifyAPI, {
    redwood: {
      apiRootPath,
      loadUserConfig: true,
    },
  })

  options.host ??= getWebHost()
  options.port ??= getWebPort()

  await fastify.listen({
    port: options.port,
    host: options.host,
    listenTextResolver: (address) => {
      // In the past, in development, we've prioritized showing a friendlier
      // host than the listen-on-all-ipv6-addresses '[::]'. Here we replace it
      // with 'localhost' only if 1) we're not in production and 2) it's there.
      // In production it's important to be transparent.
      if (process.env.NODE_ENV !== 'production') {
        address = address.replace(/http:\/\/\[::\]/, 'http://localhost')
      }

      return `Server listening at ${address}`
    },
  })

  fastify.log.trace(
    { custom: { ...fastify.initialConfig } },
    'Fastify server configuration'
  )
  fastify.log.trace(`Registered plugins\n${fastify.printPlugins()}`)

  console.log(chalk.dim.italic('Took ' + (Date.now() - timeStart) + ' ms'))

  const webServer = chalk.green(fastify.listeningOrigin)
  const apiServer = chalk.magenta(`${fastify.listeningOrigin}${apiRootPath}`)
  const graphqlEndpoint = chalk.magenta(`${apiServer}graphql`)

  console.log(`Web server listening at ${webServer}`)
  console.log(`API server listening at ${apiServer}`)
  console.log(`GraphQL endpoint at ${graphqlEndpoint}`)

  process?.send?.('ready')
}
