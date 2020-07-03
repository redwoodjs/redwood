import type { SupportedAuthTypes } from '@redwoodjs/auth'

import { netlify } from './netlify'
import { auth0 } from './auth0'
import { token } from './token'

const typesToDecoders = {
  netlify: netlify,
  auth0: auth0,
  goTrue: netlify,
  magicLink: token,
  firebase: token,
  /** Don't we support your auth client? Use the auth token in your own the `custom` client! */
  custom: token,
}

export type AuthToken = null | object | string

export interface AuthDecoder {
  decodeToken({ type, event, context }): Promise<AuthToken>
  type: SupportedAuthTypes
}

export const createAuthDecoder = (type: SupportedAuthTypes): AuthDecoder => {
  return typesToDecoders[type]()
}
