// import { DirectiveNode } from 'graphql'
import gql from 'graphql-tag'

import { getDirectiveArgument } from '@redwoodjs/graphql-server'
import type { DirectiveImplementationFunction } from '@redwoodjs/graphql-server'

import { requireAuth as applicationRequireAuth } from 'src/lib/auth'

export const schema = gql`
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

export const requireAuth: DirectiveImplementationFunction = (
  { context: _context },
  directiveNode
) => {
  // will return the roles listed in @requireAuth(roles: ['ADMIN', 'BAZINGA'])
  const requiredRoles = getDirectiveArgument(directiveNode, 'roles')

  applicationRequireAuth({ roles: requiredRoles })
}
