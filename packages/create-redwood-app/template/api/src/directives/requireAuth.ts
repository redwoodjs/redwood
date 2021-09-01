// import { DirectiveNode } from 'graphql'
import gql from 'graphql-tag'

import { requireAuth as applicationRequireAuth } from 'src/lib/auth'

export const REQUIRE_AUTH_SDL = /* GraphQL */ `
  directive @requireAuth() on FIELD_DEFINITION
`
export const schema = gql`
  ${REQUIRE_AUTH_SDL}
`

export const requireAuth = () => {
  applicationRequireAuth()
}
