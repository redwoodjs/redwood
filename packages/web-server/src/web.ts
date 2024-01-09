// NOTE: This is a copied and trimmed down version of
// packages/fastify/src/web.ts to avoid depending on that package (which comes
// with some graphql baggage we don't need here)

import fs from 'node:fs'
import path from 'node:path'

import fastifyStatic from '@fastify/static'
import fastifyUrlData from '@fastify/url-data'
import fg from 'fast-glob'
import type {
  FastifyInstance,
  FastifyReply,
  HookHandlerDoneFunction,
} from 'fastify'

import { getPaths } from '@redwoodjs/project-config'

interface RedwoodFastifyWebOptions {
  redwood?: {
    apiHost?: string
  }
}

export async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  opts: RedwoodFastifyWebOptions,
  done: HookHandlerDoneFunction
) {
  if (!fastify.hasPlugin('@fastify/url-data')) {
    await fastify.register(fastifyUrlData)
  }
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

  fastify.log.trace(
    { side: 'web', ...opts },
    'In configureFastify hook for side: web'
  )

  // Serve other non-html assets.
  fastify.register(fastifyStatic, {
    root: getPaths().web.dist,
  })

  const indexPath = getFallbackIndexPath()

  // For SPA routing, fallback on unmatched routes and let client-side routing take over.
  fastify.setNotFoundHandler({}, function (req, reply) {
    const urlData = req.urlData()
    const requestedExtension = path.extname(urlData.path ?? '')

    // If it's requesting some sort of asset, e.g. .js or .jpg files
    // Html files should fallback to the index.html
    if (requestedExtension !== '' && requestedExtension !== '.html') {
      reply.code(404)
      return reply.send('Not Found')
    }

    reply.header('Content-Type', 'text/html; charset=UTF-8')
    return reply.sendFile(indexPath)
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
