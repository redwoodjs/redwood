import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import jwt from 'jsonwebtoken'

import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn(() => {
      return {
        claims: {
          roles: ['editor', 'moderator'],
        },
      }
    }),
    decode: jest.fn(),
  }
})

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
  const decoded = await authDecoder('token', 'clerk', req)

  expect(decoded).toBe(null)
})

test('throws if NHOST_JWT_SECRET env var is not set', async () => {
  delete process.env.NHOST_JWT_SECRET

  await expect(authDecoder('token', 'nhost', req)).rejects.toThrow(
    'NHOST_JWT_SECRET env var is not set'
  )
})

test('verifies the token with secret from env', () => {
  process.env.NHOST_JWT_SECRET = 'jwt-secret'

  authDecoder('token', 'nhost', req)

  expect(jwt.verify).toHaveBeenCalledWith('token', 'jwt-secret')
})

test('uses NHOST_CLAIMS_NAMESPACE and NHOST_ROLES_CLAIM to get roles', async () => {
  process.env.NHOST_JWT_SECRET = 'jwt-secret'
  process.env.NHOST_CLAIMS_NAMESPACE = 'claims'
  process.env.NHOST_ROLES_CLAIM = 'roles'

  const decoded = await authDecoder('token', 'nhost', req)

  expect(decoded?.roles).toEqual(['editor', 'moderator'])
})
