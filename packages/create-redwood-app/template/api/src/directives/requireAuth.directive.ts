import gql from 'graphql-tag'

import type { RedwoodDirective } from '@redwoodjs/graphql-server'

import { requireAuth as applicationRequireAuth } from 'src/lib/auth'

export const schema = gql`
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

export const requireAuth: RedwoodDirective = () => {
  applicationRequireAuth()
}
