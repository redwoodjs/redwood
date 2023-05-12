import fastifyUrlData from '@fastify/url-data'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import { loadFastifyConfig } from './config'
import { lambdaRequestHandler, loadFunctionsFromDist } from './lambda'
import type { RedwoodFastifyAPIOptions } from './types'

export async function redwoodFastifyAPI(
  fastify: FastifyInstance,
  opts: RedwoodFastifyAPIOptions,
  done: HookHandlerDoneFunction
) {
  fastify.register(fastifyUrlData)

  await fastify.register(fastifyRawBody)

  fastify.addContentTypeParser(
    ['application/x-www-form-urlencoded', 'multipart/form-data'],
    { parseAs: 'string' },
    fastify.defaultTextParser
  )

  // NOTE: We should deprecate this config loading when we move to a `server.js|ts` file
  const { configureFastify } = loadFastifyConfig()
  if (configureFastify) {
    await configureFastify(fastify, { side: 'api', ...opts })
  }

  // Lambda handler
  const apiRootPath = opts.redwood?.apiRootPath || '/'
  fastify.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  fastify.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)
  await loadFunctionsFromDist()

  done()
}
