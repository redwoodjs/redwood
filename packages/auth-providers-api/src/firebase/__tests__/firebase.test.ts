import * as firebaseAdmin from 'firebase-admin'

import { req } from '../../__tests__/fixtures/helpers'
import { authDecoder } from '../decoder'

const verifyIdToken = jest.fn()

jest.spyOn(firebaseAdmin, 'auth').mockImplementation((() => {
  return {
    verifyIdToken,
  }
}) as any)

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'netlify', req)

  expect(decoded).toBe(null)
})

test('calls verifyIdToken', async () => {
  authDecoder('token', 'firebase', req)

  expect(verifyIdToken).toHaveBeenCalledWith('token')
})
