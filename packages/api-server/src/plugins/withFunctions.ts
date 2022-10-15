import fastifyUrlData from '@fastify/url-data'
import { FastifyInstance } from 'fastify'
import fastifyRawBody from 'fastify-raw-body'

import { loadFastifyConfig } from '../fastify'
import type { ApiServerArgs } from '../types'

import { lambdaRequestHandler, loadFunctionsFromDist } from './lambdaLoader'

const withFunctions = async (
  fastify: FastifyInstance,
  options: ApiServerArgs
) => {
  const { apiRootPath } = options
  // Add extra fastify plugins
  fastify.register(fastifyUrlData)

  // Fastify v4 must await the fastifyRawBody plugin
  // registration to ensure the plugin is ready
  await fastify.register(fastifyRawBody)
  const { configureFastify } = loadFastifyConfig()

  if (configureFastify) {
    await configureFastify(fastify, { side: 'api', ...options })
  }

  fastify.all(`${apiRootPath}:routeName`, lambdaRequestHandler)
  fastify.all(`${apiRootPath}:routeName/*`, lambdaRequestHandler)

  fastify.addContentTypeParser(
    ['application/x-www-form-urlencoded', 'multipart/form-data'],
    { parseAs: 'string' },
    fastify.defaultTextParser
  )

  await loadFunctionsFromDist()

  return fastify
}

export default withFunctions
