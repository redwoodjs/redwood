import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn(),
    decode: jest.fn(),
  }
})

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'not-propelauth')

  expect(decoded).toBe(null)
})
