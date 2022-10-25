import * as magic from '@magic-sdk/admin'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { authDecoder } from '../decoder'

const validate = jest.fn()

const decode = jest.fn(() => {
  return ['proof', { sub: 'abc123' }]
})

jest.spyOn(magic, 'Magic').mockImplementation((() => {
  return {
    token: {
      validate,
      decode,
    },
  }
}) as any)

const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}

let consoleError

beforeAll(() => {
  consoleError = console.error
  console.error = () => {}
})

afterAll(() => {
  console.error = consoleError
})

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'netlify', req)

  expect(decoded).toBe(null)
})

test('throws if MAGIC_SECRET_API_KEY env var is not set', async () => {
  delete process.env.MAGIC_SECRET_API_KEY

  await expect(authDecoder('token', 'magicLink', req)).rejects.toThrow(
    'MAGIC_SECRET_API_KEY environment variable not set'
  )
})

test('validates the token', () => {
  process.env.MAGIC_SECRET_API_KEY = 'api-key'

  authDecoder('token', 'magicLink', req)

  expect(validate).toHaveBeenCalled()
})

test('decodes the token', async () => {
  process.env.MAGIC_SECRET_API_KEY = 'api-key'

  const decoded = await authDecoder('token', 'magicLink', req)

  expect(decode).toHaveBeenCalled()

  // TODO: Better types for decoded so I don't have to do `as any` here
  expect((decoded?.claim as any).sub).toEqual('abc123')
})
