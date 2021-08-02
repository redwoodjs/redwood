import fs from 'fs'
import path from 'path'

import express from 'express'
import type { Application } from 'express'

import { getPaths, findBuiltHtml } from '@redwoodjs/internal'

type HtmlContents = {
  [path: string]: string
}

const withWebServer = (app: Application) => {
  const files = findBuiltHtml()

  const htmlContentsByPath: HtmlContents = files.reduce(
    (acc, cur) => ({
      ...acc,
      // TODO find something better in fs
      [cur.split('.')[0]]: fs.readFileSync(
        path.join(getPaths().web.dist, `${cur}`),
        'utf-8'
      ),
    }),
    {}
  )

  app.use(
    express.static(getPaths().web.dist, {
      redirect: false,
    })
  )

  // For SPA routing on unmatched routes
  Object.keys(htmlContentsByPath).forEach((pathName) => {
    app.get(`/${pathName}`, function (_, response) {
      response.set('Content-Type', 'text/html')
      response.send(htmlContentsByPath[pathName])
    })
  })

  return app
}

export default withWebServer
