import fs from 'fs'
import path from 'path'

import express from 'express'
import type { Application } from 'express'

import { getPaths } from '@redwoodjs/internal'

type HtmlContents = {
  [path: string]: string
}
const withWebServer = (app: Application) => {
  const files = fs
    .readdirSync(getPaths().web.dist)
    .filter((fileName) => path.extname(fileName) === 'html')
    .map((fileName) => path.basename(fileName))

  const htmlContentsByPath: HtmlContents = files.reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: fs.readFileSync(
        path.join(getPaths().web.dist, `/${cur}.html`),
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
      response.send(htmlContentsByPath[pathName])
    })
  })

  return app
}

export default withWebServer
