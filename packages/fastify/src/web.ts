import fs from 'node:fs'
import path from 'node:path'

import fastifyStatic from '@fastify/static'
import fg from 'fast-glob'
import type {
  FastifyInstance,
  FastifyReply,
  HookHandlerDoneFunction,
  // FastifyServerOptions,
} from 'fastify'

import { getPaths } from '@redwoodjs/project-config'

import { RedwoodFastifyWebOptions } from './types'

// export interface HttpServerParams {
//   port: number
//   socket?: string
//   fastify: FastifyInstance
// }

// export interface WebServerArgs extends Omit<HttpServerParams, 'fastify'> {
//   apiHost?: string
// }

// export interface ApiServerArgs extends Omit<HttpServerParams, 'fastify'> {
//   apiRootPath: string // either user supplied or '/'
// }

// export type BothServerArgs = Omit<HttpServerParams, 'fastify'>

// // Types for using server.config.js
// export type FastifySideConfigFnOptions = {
//   side: SupportedSides
// } & (WebServerArgs | BothServerArgs | ApiServerArgs)

// export type SupportedSides = 'api' | 'web'
// export type FastifySideConfigFn = (
//   fastify: FastifyInstance,
//   options?: FastifySideConfigFnOptions
// ) => Promise<FastifyInstance> | void

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

// const DEFAULT_OPTIONS = {
//   logger: {
//     level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
//   },
// }

// let isServerConfigLoaded = false
// let serverConfigFile: {
//   config: FastifyServerOptions
//   configureFastify: FastifySideConfigFn
// } = {
//   config: DEFAULT_OPTIONS,
//   configureFastify: async (fastify, options) => {
//     fastify.log.info(
//       options,
//       `In configureFastify hook for side: ${options?.side}`
//     )
//     return fastify
//   },
// }

// function loadFastifyConfig() {
//   // @TODO use require.resolve to find the config file
//   // do we need to babel first?
//   const serverConfigPath = path.join(
//     getPaths().base,
//     getConfig().api.serverConfig
//   )

//   // If a server.config.js is not found, use the default
//   // options set in packages/api-server/src/app.ts
//   if (!fs.existsSync(serverConfigPath)) {
//     return serverConfigFile
//   }

//   if (!isServerConfigLoaded) {
//     console.log(`Loading server config from ${serverConfigPath} \n`)
//     serverConfigFile = { ...require(serverConfigPath) }
//     isServerConfigLoaded = true
//   }

//   return serverConfigFile
// }

async function redwoodFastifyWeb(
  fastify: FastifyInstance,
  _opts: RedwoodFastifyWebOptions,
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

  // const { configureFastify } = loadFastifyConfig()

  // if (configureFastify) {
  //   await configureFastify(fastify, { side: 'web', ...opts })
  // }

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
