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
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'

  fastify.listen(socket || port, host)

  fastify.ready(() => {
    fastify.log.debug(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.debug(`Registered plugins \n${fastify.printPlugins()}`)
  })

  return fastify
}
