import gql from 'graphql-tag'

import { createValidatorDirective } from '@redwoodjs/graphql-server'

import { requireAuth as applicationRequireAuth } from 'src/lib/auth'

export const schema = gql`
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

const validateAuth = ({ directiveArgs }) => {
  const { roles } = directiveArgs
  applicationRequireAuth({ roles })
}

export const requireAuth = createValidatorDirective(schema, validateAuth)
