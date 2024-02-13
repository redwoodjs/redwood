import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import admin from 'firebase-admin'
import { vi, test, expect } from 'vitest'

import { authDecoder } from '../decoder'

const firebaseAuthMock = {
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
}
vi.spyOn(admin, 'auth').mockImplementation((() => {
  return firebaseAuthMock
}) as any)

const req = {
  event: {} as APIGatewayProxyEvent,
  context: {} as LambdaContext,
}

const COOKIE_MOCK = 'session=/this-is/a-session/%cookie; auth-provider=firebase'

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder(COOKIE_MOCK, 'netlify', req)

  expect(decoded).toBe(null)
})

test('calls verifyIdToken', async () => {
  authDecoder(COOKIE_MOCK, 'firebase', req)

  // Old implementation used verifyIdToken
  expect(firebaseAuthMock.verifyIdToken).not.toHaveBeenCalled()
  expect(firebaseAuthMock.verifySessionCookie).toHaveBeenCalledWith(
    '/this-is/a-session/%cookie'
  )
})
