import { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  socket?: string
  fastify: FastifyInstance
}

export const startServer = ({
  port = 8911,
  socket,
  fastify,
}: HttpServerParams) => {
  const host = 'localhost'
  const serverPort = socket ? parseInt(socket) : port

  fastify.listen({ port: serverPort, host })

  fastify.ready(() => {
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)
  })

  return fastify
}
