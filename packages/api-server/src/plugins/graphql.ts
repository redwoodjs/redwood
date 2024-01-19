import fastifyUrlData from '@fastify/url-data'
import fg from 'fast-glob'
import type {
  FastifyInstance,
  HTTPMethods,
  HookHandlerDoneFunction,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import type { Plugin } from 'graphql-yoga'

import type { GlobalContext } from '@redwoodjs/context'
import { getAsyncStoreInstance } from '@redwoodjs/context/dist/store'
import { createGraphQLYoga } from '@redwoodjs/graphql-server'
import type { GraphQLYogaOptions } from '@redwoodjs/graphql-server'
import { getPaths } from '@redwoodjs/project-config'

/**
 * Transform a Fastify Request to an event compatible with the RedwoodGraphQLContext's event
 * which is based on the AWS Lambda event
 */
import { lambdaEventForFastifyRequest } from '../requestHandlers/awsLambdaFastify'

export interface RedwoodFastifyGraphQLOptions {
  redwood?: {
    apiRootPath?: string
    graphql: GraphQLYogaOptions
  }
}

/**
 * Redwood GraphQL Server Fastify plugin based on GraphQL Yoga
 *
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {GraphQLYogaOptions} options GraphQLYogaOptions options used to configure the GraphQL Yoga Server
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: RedwoodFastifyGraphQLOptions,
  done: HookHandlerDoneFunction
) {
  // These two plugins are needed to transform a Fastify Request to a Lambda event
  // which is used by the RedwoodGraphQLContext and mimics the behavior of the
  // api-server withFunction plugin
  if (!fastify.hasPlugin('@fastify/url-data')) {
    await fastify.register(fastifyUrlData)
  }
  await fastify.register(fastifyRawBody)

  try {
    const method = ['GET', 'POST', 'OPTIONS'] as HTTPMethods[]

    // Load the graphql options from the graphql function if none are explicitly provided
    if (!options.redwood) {
      const [graphqlFunctionPath] = await fg('dist/functions/graphql.{ts,js}', {
        cwd: getPaths().api.base,
        absolute: true,
      })

      const { __rw_graphqlOptions } = await import(graphqlFunctionPath)
      options.redwood = {
        graphql: __rw_graphqlOptions,
      }
    }

    // TODO: This should be refactored to only be defined once and it might not live here
    // Ensure that each request has a unique global context
    fastify.addHook('onRequest', (_req, _reply, done) => {
      getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
    })

    const graphqlOptions = options.redwood.graphql

    // Here we can add any plugins that we want to use with GraphQL Yoga Server
    // that we do not want to add the the GraphQLHandler in the graphql-server
    // graphql function.
    //
    // These would be plugins that need a server instance such as Redwood Realtime
    if (graphqlOptions.realtime) {
      const { useRedwoodRealtime } = await import('@redwoodjs/realtime')

      const originalExtraPlugins: Array<Plugin<any>> =
        graphqlOptions.extraPlugins || []
      originalExtraPlugins.push(useRedwoodRealtime(graphqlOptions.realtime))
      graphqlOptions.extraPlugins = originalExtraPlugins

      // uses for SSE single connection mode with the `/graphql/stream` endpoint
      if (graphqlOptions.realtime.subscriptions) {
        method.push('PUT')
      }
    }

    const { yoga } = createGraphQLYoga(graphqlOptions)

    const graphQLYogaHandler = async (
      req: FastifyRequest,
      reply: FastifyReply
    ) => {
      const response = await yoga.handleNodeRequest(req, {
        req,
        reply,
        event: lambdaEventForFastifyRequest(req),
        requestContext: {},
      })

      for (const [name, value] of response.headers) {
        reply.header(name, value)
      }

      reply.status(response.status)
      reply.send(response.body)

      return reply
    }

    const routePaths = ['', '/health', '/readiness', '/stream']
    for (const routePath of routePaths) {
      fastify.route({
        url: `${yoga.graphqlEndpoint}${routePath}`,
        method,
        handler: async (req, reply) => await graphQLYogaHandler(req, reply),
      })
    }

    fastify.ready(() => {
      console.info(`GraphQL Yoga Server endpoint at ${yoga.graphqlEndpoint}`)
      console.info(
        `GraphQL Yoga Server Health Check endpoint at ${yoga.graphqlEndpoint}/health`
      )
      console.info(
        `GraphQL Yoga Server Readiness endpoint at ${yoga.graphqlEndpoint}/readiness`
      )
    })

    done()
  } catch (e) {
    console.log(e)
  }
}
