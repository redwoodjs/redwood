import fastifyUrlData from '@fastify/url-data'
import type {
  FastifyInstance,
  HTTPMethods,
  HookHandlerDoneFunction,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import fastifyRawBody from 'fastify-raw-body'
import type { Plugin } from 'graphql-yoga'

import type {
  GraphQLYogaOptions,
  GlobalContext,
} from '@redwoodjs/graphql-server'
import {
  createGraphQLYoga,
  getAsyncStoreInstance,
} from '@redwoodjs/graphql-server'

/**
 * Transform a Fastify Request to an event compatible with the RedwoodGraphQLContext's event
 * which is based on the AWS Lambda event
 */
import { lambdaEventForFastifyRequest as transformToRedwoodGraphQLContextEvent } from './lambda/index'

/**
 * Redwood GraphQL Server Fastify plugin based on GraphQL Yoga
 *
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {GraphQLYogaOptions} options GraphQLYogaOptions options used to configure the GraphQL Yoga Server
 */
export async function redwoodFastifyGraphQLServer(
  fastify: FastifyInstance,
  options: GraphQLYogaOptions,
  done: HookHandlerDoneFunction
) {
  // These two plugins are needed to transform a Fastify Request to a Lambda event
  // which is used by the RedwoodGraphQLContext and mimics the behavior of the
  // api-server withFunction plugin
  fastify.register(fastifyUrlData)
  await fastify.register(fastifyRawBody)

  try {
    const method = ['GET', 'POST', 'OPTIONS'] as HTTPMethods[]

    // TODO: This should be refactored to only be defined once and it might not live here
    // Ensure that each request has a unique global context
    fastify.addHook('onRequest', (_req, _reply, done) => {
      getAsyncStoreInstance().run(new Map<string, GlobalContext>(), done)
    })

    // Here we can add any plugins that we want to use with GraphQL Yoga Server
    // that we do not want to add the the GraphQLHandler in the graphql-server
    // graphql function.
    //
    // These would be plugins that need a server instance such as Redwood Realtime
    if (options.realtime) {
      const { useRedwoodRealtime } = await import('@redwoodjs/realtime')

      const originalExtraPlugins: Array<Plugin<any>> =
        options.extraPlugins || []
      originalExtraPlugins.push(useRedwoodRealtime(options.realtime))
      options.extraPlugins = originalExtraPlugins

      // uses for SSE single connection mode with the `/graphql/stream` endpoint
      if (options.realtime.subscriptions) {
        method.push('PUT')
      }
    }

    const { yoga } = createGraphQLYoga(options)

    const graphQLYogaHandler = async (
      req: FastifyRequest,
      reply: FastifyReply
    ) => {
      const response = await yoga.handleNodeRequest(req, {
        req,
        reply,
        event: transformToRedwoodGraphQLContextEvent(req),
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

    routePaths.forEach((routePath) => {
      fastify.route({
        url: `${yoga.graphqlEndpoint}${routePath}`,
        method,
        handler: async (req, reply) => await graphQLYogaHandler(req, reply),
      })
    })

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
