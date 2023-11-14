import httpProxy from '@fastify/http-proxy'
import type { FastifyInstance } from 'fastify'

import withApiProxy from '../plugins/withApiProxy'

test('withApiProxy registers `@fastify/http-proxy`', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
  }

  // `apiUrl` is unfortunately named. It isn't a URL, it's just a prefix. Meanwhile, `apiHost` _is_ a URL.
  // See https://github.com/fastify/fastify-http-proxy and https://github.com/fastify/fastify-reply-from.
  await withApiProxy(mockedFastifyInstance as unknown as FastifyInstance, {
    apiUrl: 'my-api-host',
    apiHost: 'http://localhost:8910',
  })

  expect(mockedFastifyInstance.register).toHaveBeenCalledWith(httpProxy, {
    disableCache: true,
    prefix: 'my-api-host',
    upstream: 'http://localhost:8910',
  })
})
