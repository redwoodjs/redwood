import fs from 'fs'
import path from 'path'

import httpProxy from '@fastify/http-proxy'
import fastifyStatic from '@fastify/static'
import fastifyUrlData from '@fastify/url-data'
import fg from 'fast-glob'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getPaths } from '@redwoodjs/project-config'

import { coerceRootPath } from './helpers'
import { resolveOptions } from './resolveOptions'
import type { RedwoodFastifyWebOptions } from './types'

export { coerceRootPath, RedwoodFastifyWebOptions }

export async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  opts: RedwoodFastifyWebOptions
) {
  const { redwoodOptions, flags } = resolveOptions(opts)

  fastify.register(fastifyUrlData)
  fastify.register(fastifyStatic, { root: getPaths().web.dist })

  // If `apiProxyTarget` is set, proxy requests from `apiUrl` to `apiProxyTarget`.
  // In this case, `apiUrl` has to be relative; `resolveOptions` above throws if it's not
  if (redwoodOptions.apiProxyTarget) {
    fastify.register(httpProxy, {
      prefix: redwoodOptions.apiUrl,
      upstream: redwoodOptions.apiProxyTarget,
      disableCache: true,
      replyOptions: {
        rewriteRequestHeaders: (req, headers) => ({
          ...headers,
          // preserve the original host header, instead of letting it be overwritten by the proxy
          host: req.headers.host,
        }),
      },
    })
  }

  // If `shouldRegisterApiUrl` is true, `apiUrl` has to be defined
  // but TS doesn't know that so it complains about `apiUrl` being undefined
  // in `fastify.all(...)` below. So we have to do this check for now
  if (redwoodOptions.apiUrl && flags.shouldRegisterApiUrl) {
    const apiUrlHandler = (_req: FastifyRequest, reply: FastifyReply) => {
      reply.code(200)
      reply.send({
        data: null,
        errors: [
          {
            message: `Bad Gateway: you may have misconfigured apiUrl and apiProxyTarget. If apiUrl is a relative URL, you must provide apiProxyTarget.`,
            extensions: {
              code: 'BAD_GATEWAY',
              httpStatus: 502,
            },
          },
        ],
      })
    }

    const apiUrlWarningPath = coerceRootPath(redwoodOptions.apiUrl)

    fastify.all(apiUrlWarningPath, apiUrlHandler)
    fastify.all(`${apiUrlWarningPath}*`, apiUrlHandler)
  }

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
}
