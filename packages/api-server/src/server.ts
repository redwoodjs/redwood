import { FastifyInstance } from 'fastify'

export interface HttpServerParams {
  port: number
  socket?: string
  app: FastifyInstance
}

export const startServer = ({ port = 8911, socket, app }: HttpServerParams) => {
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::'

  app.listen(socket || port, host)

  return app
}
