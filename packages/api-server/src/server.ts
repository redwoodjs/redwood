import { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  host?: string
  socket?: string
  fastify: FastifyInstance
}

export const startServer = ({
  port = 8911,
  host = 'localhost',
  socket,
  fastify,
}: HttpServerParams) => {
  const serverPort = socket ? parseInt(socket) : port

  fastify.listen({ port: serverPort, host })

  fastify.ready(() => {
    fastify.log.debug(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.debug(`Registered plugins \n${fastify.printPlugins()}`)
  })

  return fastify
}
