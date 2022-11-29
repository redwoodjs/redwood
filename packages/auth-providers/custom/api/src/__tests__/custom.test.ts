import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { authDecoder } from '../decoder'

let consoleError

beforeAll(() => {
  consoleError = console.error
  console.error = () => {}
})

afterAll(() => {
  console.error = consoleError
})

const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}

test('returns null', async () => {
  const decoded = await authDecoder('token', 'custom-bazinga-auth', req)

  expect(decoded).toBe(null)
})
