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
    console.info(`Registered plugins \n${fastify.printPlugins()}`)
    fastify.log.info(`Registered plugins \n${fastify.printPlugins()}`)
  })

  return fastify
}
