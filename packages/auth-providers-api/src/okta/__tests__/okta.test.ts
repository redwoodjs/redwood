import OktaJwtVerifier from '@okta/jwt-verifier'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { authDecoder } from '../decoder'

jest
  .spyOn(OktaJwtVerifier.prototype, 'verifyAccessToken')
  .mockImplementation(() => {
    return Promise.resolve({ claims: { sub: 'abc123' } } as OktaJwtVerifier.Jwt)
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
  const decoded = await authDecoder('token', 'netlify', req)

  expect(decoded).toBe(null)
})

test('throws if OKTA_DOMAIN env var is not set', async () => {
  delete process.env.OKTA_DOMAIN

  await expect(authDecoder('token', 'okta', req)).rejects.toThrow(
    'OKTA_DOMAIN or OKTA_AUDIENCE env vars are not set'
  )
})

test('throws if OKTA_AUDIENCE env var is not set', async () => {
  delete process.env.OKTA_AUDIENCE

  await expect(authDecoder('token', 'okta', req)).rejects.toThrow(
    'OKTA_DOMAIN or OKTA_AUDIENCE env vars are not set'
  )
})

test('validates the token', async () => {
  process.env.OKTA_DOMAIN = 'domain'
  process.env.OKTA_AUDIENCE = 'audience'

  await authDecoder('token', 'okta', req)

  expect(OktaJwtVerifier.prototype.verifyAccessToken).toHaveBeenCalledWith(
    'token',
    'audience'
  )
})

test('returns claims', async () => {
  process.env.OKTA_DOMAIN = 'domain'
  process.env.OKTA_AUDIENCE = 'audience'

  const decoded = await authDecoder('token', 'okta', req)

  expect(decoded?.sub).toEqual('abc123')
})
