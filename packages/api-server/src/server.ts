import { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  socket?: string
  app: FastifyInstance
}

export const startServer = ({ port = 8911, socket, app }: HttpServerParams) => {
  app.listen(socket || port, '::')

  return app
}
