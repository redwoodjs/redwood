import fastifyUrlData from '@fastify/url-data'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import { lambdaRequestHandler, loadFunctionsFromDist } from './lambda'
import type { RedwoodFastifyAPIOptions } from './types'

async function redwoodFastifyAPI(
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

  // Lambda handler
  const apiRootPath = opts.redwood?.apiRootPath || '/'
  fastify.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  fastify.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)
  await loadFunctionsFromDist()

  done()
}

export { redwoodFastifyAPI }
