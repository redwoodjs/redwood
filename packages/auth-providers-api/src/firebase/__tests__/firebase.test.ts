import * as firebaseAdmin from 'firebase-admin'

const verifyIdToken = jest.fn()

jest.spyOn(firebaseAdmin, 'auth').mockImplementation((() => {
  return {
    verifyIdToken,
  }
}) as any)

import { authDecoder } from '../decoder'

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'netlify', {} as any)

  expect(decoded).toBe(null)
})

test('calls verifyIdToken', async () => {
  authDecoder('token', 'firebase', {} as any)

  expect(verifyIdToken).toHaveBeenCalledWith('token')
})
