import fastifyUrlData from '@fastify/url-data'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import type { GlobalContext } from '@redwoodjs/context'
import { getAsyncStoreInstance } from '@redwoodjs/context/dist/store'

import { loadFastifyConfig } from './config'
import { lambdaRequestHandler, loadFunctionsFromDist } from './lambda'
import type { RedwoodFastifyAPIOptions } from './types'

export async function redwoodFastifyAPI(
  fastify: FastifyInstance,
  opts: RedwoodFastifyAPIOptions,
  done: HookHandlerDoneFunction
) {
  if (!fastify.hasPlugin('@fastify/url-data')) {
    await fastify.register(fastifyUrlData)
  }
  await fastify.register(fastifyRawBody)

  // TODO: This should be refactored to only be defined once and it might not live here
  // Ensure that each request has a unique global context
  fastify.addHook('onRequest', (_req, _reply, done) => {
    getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
  })

  fastify.addContentTypeParser(
    ['application/x-www-form-urlencoded', 'multipart/form-data'],
    { parseAs: 'string' },
    fastify.defaultTextParser
  )

  // NOTE: Deprecate this when we move to a `server.ts` file.
  const { configureFastify } = loadFastifyConfig()
  if (configureFastify) {
    await configureFastify(fastify, { side: 'api', ...opts })
  }

  const apiRootPath = opts.redwood?.apiRootPath || '/'
  fastify.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  fastify.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)
  await loadFunctionsFromDist()

  done()
}
