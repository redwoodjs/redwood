import jwt from 'jsonwebtoken'

import { authDecoder } from '../decoder'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}))

beforeEach(() => {})

test('returns null for unsupported type', async () => {
  const decoded = await authDecoder('token', 'netlify', {} as any)

  expect(decoded).toBe(null)
})

test('throws if AUTHORITY env var is not set', async () => {
  process.env.AZURE_ACTIVE_DIRECTORY_AUTHORITY = undefined
  process.env.AZURE_ACTIVE_DIRECTORY_JTW_ISSUER = 'jwt-issuer'

  expect(() => {
    authDecoder('token', 'azureActiveDirectory', {} as any)
  }).toThrowError('AZURE_ACTIVE_DIRECTORY_AUTHORITY env var is not set.')
})

describe('invoking in prod', () => {
  let NODE_ENV

  beforeAll(() => {
    NODE_ENV = process.env.NODE_ENV
    process.env.AZURE_ACTIVE_DIRECTORY_AUTHORITY = 'authority'
    process.env.AZURE_ACTIVE_DIRECTORY_JTW_ISSUER = 'jwt-issuer'
  })

  afterAll(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  test('verify, not decode, is called in production', async () => {
    process.env.NODE_ENV = 'production'

    authDecoder('token', 'azureActiveDirectory', {} as any)

    expect(jwt.decode).not.toBeCalled()
    expect(jwt.verify).toBeCalled()
  })
})
