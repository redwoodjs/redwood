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
    apiProxyTarget?: string

    /**
     * @deprecated Use `apiProxyTarget` instead.
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

export function resolveOptions(options: RedwoodFastifyWebOptions) {
  const redwood = options.redwood ?? {}

  redwood.apiUrl ??= getConfig().web.apiUrl
  const apiUrlIsFullyQualifiedUrl = isFullyQualifiedUrl(redwood.apiUrl)

  // `apiHost` is deprecated. If it's set and `apiProxyTarget` isn't, we'll use it as `apiProxyTarget`.
  if (redwood.apiHost && !redwood.apiProxyTarget) {
    redwood.apiProxyTarget = redwood.apiHost
    delete redwood.apiHost
  }

  if (redwood.apiProxyTarget && !isFullyQualifiedUrl(redwood.apiProxyTarget)) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '${redwood.apiProxyTarget}'`
    )
  }

  // If users don't supply `apiUrl` but do supply `apiProxyTarget`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: undefined,
  //   apiProxyTarget: 'http://api.bar.com'
  // }
  // ```
  //
  // This is pretty unlikely because we default `apiUrl` to '/.redwood/functions'
  if (!redwood.apiUrl && redwood.apiProxyTarget) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, \`apiUrl\` has to be a relative URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a fully-qualified `apiUrl` and `apiProxyTarget`, error.
  // We don't have a prefix to use as the starting point of a proxy.
  //
  // ```js
  // {
  //   apiUrl: 'http://api.foo.com', // This isn't a prefix we can forward requests from
  //   apiProxyTarget: 'http://api.bar.com'
  // }
  // ```
  if (apiUrlIsFullyQualifiedUrl && redwood.apiProxyTarget) {
    throw new Error(
      `If you provide \`apiProxyTarget\`, \`apiUrl\` cannot be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
    )
  }

  // If users supply a relative `apiUrl` but don't supply `apiProxyTarget`, error.
  // There's nowhere to proxy to.
  //
  // ```js
  // {
  //   apiUrl: '/api',
  //   apiProxyTarget: undefined // There's nowhere for requests to '/api' to go
  // }
  // ```
  // if (!apiUrlIsFullyQualifiedUrl && !redwood.apiProxyTarget) {
  //   throw new Error(
  //     `If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '${redwood.apiUrl}'`
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
