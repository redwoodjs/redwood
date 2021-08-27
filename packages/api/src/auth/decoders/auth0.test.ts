import jwt from 'jsonwebtoken'

import { verifyAuth0Token } from './auth0'

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}))

test('verify, and not decode, should be called in production', () => {
  const { NODE_ENV } = process.env
  process.env.NODE_ENV = 'production'
  process.env.AUTH0_DOMAIN = 'redwoodjs.com'
  process.env.AUTH0_AUDIENCE = 'michael bolton'

  // @ts-expect-error Ingore this error.
  verifyAuth0Token({})

  expect(jwt.decode).not.toBeCalled()
  expect(jwt.verify).toBeCalled()

  process.env.NODE_ENV = NODE_ENV
})
