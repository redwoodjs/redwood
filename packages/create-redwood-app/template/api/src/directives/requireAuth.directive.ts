import gql from 'graphql-tag'

import {
  RedwoodDirective,
  getDirectiveArgument,
} from '@redwoodjs/graphql-server'

import { requireAuth as applicationRequireAuth } from 'src/lib/auth'

export const schema = gql`
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

export const requireAuth: RedwoodDirective = (
  { directiveNode }
) => {
  // get the roles listed in your sdl
  // e.g. @requireAuth(roles: ['ADMIN', 'BAZINGA'])
  //                           ───┬───   ────┬──
  //   requiredRoles ─────────────┘──────────┘
  const requiredRoles = directiveNode
    ? getDirectiveArgument(directiveNode, 'roles')
    : []

  applicationRequireAuth({
    roles: requiredRoles,
  })
}
