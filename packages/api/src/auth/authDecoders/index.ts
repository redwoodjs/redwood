import type { SupportedAuthTypes } from '@redwoodjs/auth'

import { netlify } from './netlify'
import { auth0 } from './auth0'
import { goTrue } from './goTrue'
import { magicLink } from './magicLink'
import { firebase } from './firebase'
import { custom } from './custom'

const typesToDecoders = {
  netlify,
  auth0,
  goTrue,
  magicLink,
  firebase,
  /** Don't we support your auth client? No problem, define your own the `custom` type! */
  custom,
}

export type AuthToken = null | object | string

export interface AuthDecoder {
  decodeToken({ type, event, context }): Promise<AuthToken>
  type: SupportedAuthTypes
}

export const createAuthDecoder = (type: SupportedAuthTypes): AuthDecoder => {
  return typesToDecoders[type]()
}
