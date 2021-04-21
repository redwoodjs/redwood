import path from 'path'

import type { Application } from 'express'
import express from 'express'

import { getPaths } from '@redwoodjs/internal'

const withWebServer = (app: Application) => {
  app.use(
    express.static(getPaths().web.dist, {
      redirect: false,
    })
  )

  // For SPA routing
  app.get('*', function (_, response) {
    response.sendFile(path.join(getPaths().web.dist, '/index.html'))
  })

  return app
}

export default withWebServer
