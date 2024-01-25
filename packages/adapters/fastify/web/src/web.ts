import fs from 'fs'
import path from 'path'

import httpProxy from '@fastify/http-proxy'
import fastifyStatic from '@fastify/static'
import fastifyUrlData from '@fastify/url-data'
import fg from 'fast-glob'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'

import { getConfig, getPaths } from '@redwoodjs/project-config'

export interface RedwoodFastifyWebOptions {
  redwood?: {
    apiUrl?: string
    apiUpstreamUrl?: string

    /**
     * @deprecated Use `apiUpstreamUrl` instead.
     */
    apiHost?: string
  }
}

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

  // If `apiUpstreamUrl` is set, proxy requests from `apiUrl` to `apiUpstreamUrl`.
  // In this case, `apiUrl` has to be relative; `resolveOptions` above throws if it's not
  if (options.redwood.apiUpstreamUrl) {
    fastify.log.debug('registering proxy')

    fastify.register(httpProxy, {
      prefix: options.redwood.apiUrl,
      upstream: options.redwood.apiUpstreamUrl,
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

export function resolveOptions(options: RedwoodFastifyWebOptions) {
  const redwood = options.redwood ?? {}

  redwood.apiUrl ??= getConfig().web.apiUrl
  const apiUrlIsFullyQualifiedUrl = isFullyQualifiedUrl(redwood.apiUrl)

  // `apiHost` is deprecated. If it's set and `apiUpstreamUrl` isn't, we'll use it as `apiUpstreamUrl`.
  if (redwood.apiHost && !redwood.apiUpstreamUrl) {
    redwood.apiUpstreamUrl = redwood.apiHost
    delete redwood.apiHost
  }

  if (redwood.apiUpstreamUrl && !isFullyQualifiedUrl(redwood.apiUpstreamUrl)) {
    throw new Error(
      `If you provide \`apiUpstreamUrl\`, it has to be a fully-qualified URL. \`apiUpstreamUrl\` is '${redwood.apiUpstreamUrl}'`
    )
  }

  // If users don't supply `apiUrl` but do supply `apiUpstreamUrl`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: undefined,
  //   apiUpstreamUrl: 'http://api.bar.com'
  // }
  // ```
  //
  // This is pretty unlikely because we default `apiUrl` to '/.redwood/functions'
  if (!redwood.apiUrl && redwood.apiUpstreamUrl) {
    throw new Error(
      `If you provide \`apiUpstreamUrl\`, \`apiUrl\` has to be a relative URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a fully-qualified `apiUrl` and `apiUpstreamUrl`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: 'http://api.foo.com', // This isn't a prefix we can forward requests from
  //   apiUpstreamUrl: 'http://api.bar.com'
  // }
  // ```
  if (apiUrlIsFullyQualifiedUrl && redwood.apiUpstreamUrl) {
    throw new Error(
      `If you provide \`apiUpstreamUrl\`, \`apiUrl\` cannot be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a relative `apiUrl` but don't supply `apiUpstreamUrl`, error.
  // There's nowhere to proxy to.
  //
  // ```js
  // {
  //   apiUrl: '/api',
  //   apiUpstreamUrl: undefined // There's nowhere for requests to '/api' to go
  // }
  // ```
  // if (!apiUrlIsFullyQualifiedUrl && !redwood.apiUpstreamUrl) {
  //   throw new Error(
  //     `If you don't provide \`apiUpstreamUrl\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
  //   )
  // }

  return { redwood }
}

function isFullyQualifiedUrl(url: string) {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}
