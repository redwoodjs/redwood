import path from 'path'

import fastifyStatic from '@fastify/static'
import { FastifyInstance } from 'fastify'

export default async function routes(fastify: FastifyInstance, _options: any) {
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', '..', 'web'),
  })
}
