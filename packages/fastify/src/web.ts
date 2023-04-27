import fs from 'node:fs'
import path from 'node:path'

import fastifyStatic from '@fastify/static'
import fg from 'fast-glob'
import type {
  FastifyInstance,
  FastifyReply,
  HookHandlerDoneFunction,
} from 'fastify'

import { getPaths } from '@redwoodjs/project-config'

import { loadFastifyConfig } from './config'
import { RedwoodFastifyWebOptions } from './types'

/**
 * NOTE: Copied from @redwoodjs/internal/dist/files because I don't want to depend on @redwoodjs/internal
 */
// import { findPrerenderedHtml } from '@redwoodjs/internal/dist/files'
export const findPrerenderedHtml = (cwd = getPaths().web.dist) =>
  fg.sync('**/*.html', { cwd, ignore: ['200.html', '404.html'] })

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

async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  opts: RedwoodFastifyWebOptions,
  done: HookHandlerDoneFunction
) {
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

  // NOTE: We should deprecate this config loading when we move to a `server.js|ts` file
  const { configureFastify } = loadFastifyConfig()
  if (configureFastify) {
    await configureFastify(fastify, { side: 'web', ...opts })
  }

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

  done()
}

export { redwoodFastifyWeb }
