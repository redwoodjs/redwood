import fs from 'fs'
import path from 'path'

import fastifyStatic from '@fastify/static'
import { FastifyInstance, FastifyReply } from 'fastify'

import { findPrerenderedHtml, getPaths } from '@redwoodjs/internal'

import { loadFastifyConfig } from '../fastify'

export const getFallbackIndexPath = () => {
  const prerenderIndexPath = path.join(getPaths().web.dist, '/200.html')

  // If 200 exists: project has been prerendered
  // If 200 doesn't exist: fallback to default index.html
  if (fs.existsSync(prerenderIndexPath)) {
    return '200.html'
  } else {
    return 'index.html'
  }
}

const withWebServer = async (fastify: FastifyInstance) => {
  const prerenderedFiles = findPrerenderedHtml()
  const indexPath = getFallbackIndexPath()

  // Serve prerendered HTML directly, instead of the index
  prerenderedFiles
    .filter((filePath) => filePath !== 'index.html') // remove index.html
    .forEach((filePath) => {
      const pathName = filePath.split('.html')[0]
      fastify.get(`/${pathName}`, (_, reply: FastifyReply) => {
        reply.header('Content-Type', 'text/html; charset=UTF-8')
        reply.sendFile(filePath)
      })
    })

  const { configureFastifyForSide } = loadFastifyConfig()
  fastify = await configureFastifyForSide(fastify, { side: 'web' })

  // Serve other non-html assets
  fastify.register(fastifyStatic, {
    root: getPaths().web.dist,
  })

  // For SPA routing fallback on unmatched routes
  // And let JS routing take over
  fastify.setNotFoundHandler({}, function (_, reply: FastifyReply) {
    reply.header('Content-Type', 'text/html; charset=UTF-8')
    reply.sendFile(indexPath)
  })

  return fastify
}

export default withWebServer
