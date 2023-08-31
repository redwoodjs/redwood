import { FastifyInstance } from 'fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { YogaServerInstance } from 'graphql-yoga'

export default async function routes(
  fastify: FastifyInstance,
  {
    yoga,
  }: {
    yoga: YogaServerInstance<
      {
        req: FastifyRequest
        reply: FastifyReply
      },
      Record<string, unknown>
    >
  }
) {
  fastify.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await yoga.handleNodeRequest(req, {
        req,
        reply,
      })
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })
      reply.status(response.status)
      reply.send(response.body)
      return reply
    },
  })
}
