import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { YogaServerInstance } from 'graphql-yoga'

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
      {}
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
      for (const [name, value] of response.headers) {
        reply.header(name, value)
      }
      reply.status(response.status)
      reply.send(response.body)
      return reply
    },
  })
}
