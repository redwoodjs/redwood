import gql from 'graphql-tag'

import { AuthenticationError } from '../errors'

export const REQUIRE_AUTH_SDL = /* GraphQL */ `
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

// onExecute
export const requireAuth = () => {
  throw new AuthenticationError('HALT! You shall not pass....')
}

export const SKIP_AUTH_SDL = /* GraphQL */ `
  directive @skipAuth on FIELD_DEFINITION
`
// onExecute
export const skipAuth = () => {
  return
}

export const schema = gql`
  ${REQUIRE_AUTH_SDL}
  ${SKIP_AUTH_SDL}
`
