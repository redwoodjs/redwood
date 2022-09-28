import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import * as firebaseAdmin from 'firebase-admin'

import { authDecoder } from '../decoder'

const verifyIdToken = jest.fn()

jest.spyOn(firebaseAdmin, 'auth').mockImplementation((() => {
  return {
    verifyIdToken,
  }
}) as any)

const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'netlify', req)

  expect(decoded).toBe(null)
})

test('calls verifyIdToken', async () => {
  authDecoder('token', 'firebase', req)

  expect(verifyIdToken).toHaveBeenCalledWith('token')
})
