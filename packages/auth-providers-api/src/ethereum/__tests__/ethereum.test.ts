import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'

import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}))

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

test('throws if ETHEREUM_JWT_SECRET env var is not set', async () => {
  delete process.env.ETHEREUM_JWT_SECRET

  await expect(authDecoder('token', 'ethereum', req)).rejects.toThrow(
    'ETHEREUM_JWT_SECRET env var is not set'
  )
})

test('verify, and not decode, should be called in production', () => {
  const NODE_ENV = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  process.env.ETHEREUM_JWT_SECRET = 'jwt-secret'

  authDecoder('token', 'ethereum', req)

  expect(jwt.decode).not.toBeCalled()
  expect(jwt.verify).toBeCalled()

  process.env.NODE_ENV = NODE_ENV
})
