import type { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  socket?: string
  fastify: FastifyInstance
}

export const startServer = async ({
  port = 8911,
  socket,
  fastify,
}: HttpServerParams) => {
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'
  const serverPort = socket ? parseInt(socket) : port

  await fastify.listen({
    port: serverPort,
    host,
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

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)
  })

  return fastify
}
