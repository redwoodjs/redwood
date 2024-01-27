import fs from 'fs'
import path from 'path'

import httpProxy from '@fastify/http-proxy'
import fastifyStatic from '@fastify/static'
import fastifyUrlData from '@fastify/url-data'
import fg from 'fast-glob'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'

import { getPaths } from '@redwoodjs/project-config'

import { resolveOptions } from './resolveOptions'
import type { RedwoodFastifyWebOptions } from './types'

export async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  opts: RedwoodFastifyWebOptions,
  done: HookHandlerDoneFunction
) {
  fastify.log.debug('opts')
  fastify.log.debug(opts)

  const options = resolveOptions(opts)

  fastify.log.debug('resolving options')
  fastify.log.debug(options)

  await fastify.register(fastifyUrlData)

  // Serve prerendered files directly, instead of the index
  const prerenderedFiles = await fg('**/*.html', {
    cwd: getPaths().web.dist,
    ignore: ['index.html', '200.html', '404.html'],
  })

  for (const prerenderedFile of prerenderedFiles) {
    const [pathName] = prerenderedFile.split('.html')

    fastify.get(`/${pathName}`, (_, reply) => {
      reply.header('Content-Type', 'text/html; charset=UTF-8')
      reply.sendFile(prerenderedFile)
    })
  }

  fastify.log.debug(`registering static assets at ${getPaths().web.dist}`)
  fastify.log.debug(getPaths().web.dist)
  // Serve static assets
  fastify.register(fastifyStatic, {
    root: getPaths().web.dist,
  })

  // If `apiProxyTarget` is set, proxy requests from `apiUrl` to `apiProxyTarget`.
  // In this case, `apiUrl` has to be relative; `resolveOptions` above throws if it's not
  if (options.redwood.apiProxyTarget) {
    fastify.log.debug('registering proxy')

    fastify.register(httpProxy, {
      prefix: options.redwood.apiUrl,
      upstream: options.redwood.apiProxyTarget,
      disableCache: true,
    })
  }

  // If `200.html` exists, the project has been prerendered.
  // If it doesn't, fallback to the default (`index.html`)
  const prerenderIndexPath = path.join(getPaths().web.dist, '200.html')

  const fallbackIndexPath = fs.existsSync(prerenderIndexPath)
    ? '200.html'
    : 'index.html'

  // For SPA routing, fallback on unmatched routes and let client-side routing take over
  fastify.setNotFoundHandler({}, (req, reply) => {
    const urlData = req.urlData()
    const requestedExtension = path.extname(urlData.path ?? '')

    // Paths with no extension (`/about`) or an .html extension (`/about.html`)
    // should be handled by the client side router.
    // See the discussion in https://github.com/redwoodjs/redwood/pull/9272.
    if (requestedExtension === '' || requestedExtension === '.html') {
      reply.header('Content-Type', 'text/html; charset=UTF-8')
      return reply.sendFile(fallbackIndexPath)
    }

    // If we got here, the user is requesting an asset with an extension
    // (like `profile.png`) that doesn't exist
    reply.code(404)
    return reply.send('Not Found')
  })

  done()
}
