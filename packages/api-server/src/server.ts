import fs from 'fs'

import type { Application } from 'express'

export interface HttpServerParams {
  port: number
  socket?: string
  app: Application
}

export const startServer = ({ port = 8911, socket, app }: HttpServerParams) => {
  const server = app.listen(socket || port).on('close', () => {
    if (socket) {
      fs.rmSync(socket)
    }
  })

  return server
}
