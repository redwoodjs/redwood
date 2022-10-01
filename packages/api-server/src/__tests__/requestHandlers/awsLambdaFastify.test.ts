import type { FastifyRequest, FastifyReply } from 'fastify'

import { requestHandler } from '../../requestHandlers/awsLambdaFastify'

describe('Tests AWS Lambda to Fastify request transformation and handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const request = {
    method: 'GET',
    body: '',
    headers: '',
    query: '/',
    params: {},
    url: '/',
    urlData: () => ({ path: '/' }),
    log: console as unknown,
  } as unknown as FastifyRequest

  const mockedReply = {
    status: (code) => {
      return { code, send: jest.fn() }
    },
    headers: (h) => jest.fn(h),
    send: (body) => jest.fn(body),
    log: console as unknown,
  } as unknown as FastifyReply

  test('requestHandler replies with simple body', async () => {
    jest.spyOn(mockedReply, 'send')
    jest.spyOn(mockedReply, 'status')

    const handler = async (req, mockedReply) => {
      mockedReply = { body: { foo: 'bar' } }
      return mockedReply
    }

    await requestHandler(request, mockedReply, handler)

    expect(mockedReply.send).toHaveBeenCalledWith({ foo: 'bar' })
    expect(mockedReply.status).toHaveBeenCalledWith(200)
  })

  test('requestHandler replies with a base64Encoded body', async () => {
    jest.spyOn(mockedReply, 'send')
    jest.spyOn(mockedReply, 'status')

    const handler = async (req, mockedReply) => {
      mockedReply = {
        body: 'this_is_a_test_of_base64Encoding',
        isBase64Encoded: true,
      }
      return mockedReply
    }

    await requestHandler(request, mockedReply, handler)

    expect(mockedReply.send).toHaveBeenCalledWith(
      Buffer.from('this_is_a_test_of_base64Encoding', 'base64')
    )
    expect(mockedReply.status).toHaveBeenCalledWith(200)
  })

  describe('error handling', () => {
    let consoleError

    beforeEach(() => {
      consoleError = console.error
      console.error = () => {}
    })

    afterEach(() => {
      console.error = consoleError
    })

    test('requestHandler returns an error status if handler throws an error', async () => {
      jest.spyOn(mockedReply, 'status')

      const handler = async () => {
        throw new Error('error')
      }

      await requestHandler(request, mockedReply, handler)

      expect(mockedReply.status).toHaveBeenCalledWith(500)
    })
  })

  test('requestHandler replies with headers', async () => {
    const headersRequest = {
      method: 'GET',
      body: '',
      headers: {},
      query: '/',
      params: {},
      url: '/',
      urlData: () => ({ path: '/' }),
      log: console as unknown,
    } as unknown as FastifyRequest

    jest.spyOn(mockedReply, 'headers')

    const handler = async (req, mockedReply) => {
      mockedReply = {
        body: { foo: 'bar' },
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token 123',
        },
      }
      return mockedReply
    }

    await requestHandler(headersRequest, mockedReply, handler)

    expect(mockedReply.headers).toHaveBeenCalledWith({
      'content-type': 'application/json',
      authorization: 'Bearer token 123',
    })
  })

  test('requestHandler replies with multi-value headers', async () => {
    const headersRequest = {
      method: 'GET',
      body: '',
      headers: {},
      query: '/',
      params: {},
      url: '/',
      urlData: () => ({ path: '/' }),
      log: console as unknown,
    } as unknown as FastifyRequest

    jest.spyOn(mockedReply, 'headers')

    const handler = async (req, mockedReply) => {
      mockedReply = {
        body: {},
        headers: {},
        multiValueHeaders: {
          'content-type': ['application/json', 'text/html'],
        },
      }
      return mockedReply
    }

    await requestHandler(headersRequest, mockedReply, handler)

    expect(mockedReply.headers).toHaveBeenCalledWith({
      'content-type': 'application/json; text/html',
    })
  })
})
