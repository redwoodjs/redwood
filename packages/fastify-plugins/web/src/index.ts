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

export async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  _opts: RedwoodFastifyWebOptions,
  done: HookHandlerDoneFunction
) {
  const prerenderedFiles = findPrerenderedHtml()

  // Serve prerendered HTML directly, instead of the index.
  prerenderedFiles
    .filter((filePath) => filePath !== 'index.html') // remove index.html
    .forEach((filePath) => {
      const [pathName] = filePath.split('.html')

      fastify.get(`/${pathName}`, (_, reply: FastifyReply) => {
        reply.header('Content-Type', 'text/html; charset=UTF-8')
        reply.sendFile(filePath)
      })
    })

  // Serve other non-html assets.
  fastify.register(fastifyStatic, {
    root: getPaths().web.dist,
  })

  const indexPath = getFallbackIndexPath()

  // For SPA routing, fallback on unmatched routes and let client-side routing take over.
  fastify.setNotFoundHandler({}, function (_, reply: FastifyReply) {
    reply.header('Content-Type', 'text/html; charset=UTF-8')
    reply.sendFile(indexPath)
  })

  done()
}

// NOTE: This function was copied from @redwoodjs/internal/dist/files to avoid depending on @redwoodjs/internal.
// import { findPrerenderedHtml } from '@redwoodjs/internal/dist/files'
function findPrerenderedHtml(cwd = getPaths().web.dist) {
  return fg.sync('**/*.html', { cwd, ignore: ['200.html', '404.html'] })
}

function getFallbackIndexPath() {
  const prerenderIndexPath = path.join(getPaths().web.dist, '/200.html')

  // If 200 exists: the project has been prerendered.
  // If 200 doesn't exist: fallback to the default, index.html.
  if (fs.existsSync(prerenderIndexPath)) {
    return '200.html'
  } else {
    return 'index.html'
  }
}

export interface RedwoodFastifyWebOptions {
  redwood?: {
    apiHost?: string
  }
}
