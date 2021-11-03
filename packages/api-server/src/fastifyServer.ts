import { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  socket?: string
  fastifyInstance: FastifyInstance
}

export const startServer = ({
  port = 8911,
  socket,
  fastifyInstance,
}: HttpServerParams) => {
  fastifyInstance.listen(socket || port, '0.0.0.0')

  return fastifyInstance
}
