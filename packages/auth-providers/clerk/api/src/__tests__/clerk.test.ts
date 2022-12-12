import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { authDecoder } from '../decoder'

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

test('throws if CLERK_JWT_KEY env var is not set', async () => {
  delete process.env.CLERK_JWT_KEY
  process.env.CLERK_API_KEY = 'api-key'

  await expect(authDecoder('token', 'clerk', req)).rejects.toThrow(
    'CLERK_JWT_KEY env var is not set'
  )
})

test('rejects when the token is invalid', async () => {
  process.env.CLERK_JWT_KEY = 'jwt-key'

  await expect(authDecoder('invalid-token', 'clerk', req)).rejects.toThrow()
})
