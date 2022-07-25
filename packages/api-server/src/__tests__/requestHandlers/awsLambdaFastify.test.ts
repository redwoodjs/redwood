import type { FastifyRequest, FastifyReply } from 'fastify'
import { URIComponents } from 'uri-js'

import { requestHandler } from '../../requestHandlers/awsLambdaFastify'

declare module 'fastify' {
  interface FastifyRequest {
    urlData(): URIComponents
    urlData<K extends keyof URIComponents>(target: K): URIComponents[K]
  }
}

describe('Tests AWS Lambda to Fastify request transformation and handling', () => {
  test('requestHandler', async () => {
    const request = {
      method: 'GET',
      body: { foo: 'bar' },
      headers: { foo: 'bar' },
      query: '/',
      params: { a: 1 },
      url: '/',
      urlData: () => ({ path: '/', query: '/foo', fragment: 'frag' }),
      log: console as unknown,
    } as unknown as FastifyRequest

    const mockedReply = {
      status: (code) => {
        return { code, send: jest.fn() }
      },
      headers: jest.fn(),
      send: (body) => jest.fn(body),
      log: console as unknown,
    } as unknown as FastifyReply

    const handler = async (req, rep) => {
      console.log(req)
      console.log(rep)
      const r = { body: { foo: 'bar' } } // ?
      return r
    }
    await requestHandler(request, mockedReply, handler) // ?
    expect(mockedReply.send).toHaveBeenCalled()
  })
})
