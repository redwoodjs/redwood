import type { Context as LambdaContext } from 'aws-lambda'
import { DirectiveNode, GraphQLResolveInfo } from 'graphql'
import gql from 'graphql-tag'

import { AuthenticationError, ForbiddenError } from '../errors'

export interface User {
  roles?: Array<string>
}
export interface CurrentUser {
  currentUser: User
}

export const REQUIRE_AUTH_SDL = /* GraphQL */ `
  directive @requireAuth(roles: [String]) on FIELD_DEFINITION
`

// use this to get specific argument values
// e.g. getDirectiveArgument(directive, 'roles')
// will return the roles listed in @requireAuth(roles: ['ADMIN', 'BAZINGA'])
export function getDirectiveArgument(
  directive: DirectiveNode,
  argumentName: string
) {
  if (directive.kind === 'Directive') {
    const directiveArgs = directive.arguments?.filter(
      (d) => d.name.value === argumentName
    )

    if (directiveArgs) {
      // needs improvement
      const outputArgs =
        directiveArgs
          .values()
          .next()
          .value?.value?.values?.map((v: any) => v.value) || undefined

      return outputArgs
    }
  }

  return undefined
}

export const requireAuth = (
  resolverInfo?: {
    root: unknown
    context: LambdaContext & CurrentUser
    args: Record<string, unknown>
    info: GraphQLResolveInfo
  },
  directiveNode?: DirectiveNode
) => {
  if (resolverInfo) {
    const roles = directiveNode
      ? getDirectiveArgument(directiveNode, 'roles')
      : []

    if (!isAuthenticated(resolverInfo.context)) {
      throw new AuthenticationError("You don't have permission to do that.")
    }

    if (!hasRole(resolverInfo.context, roles)) {
      throw new ForbiddenError("You don't have access to do that.")
    }
  }
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

/**
 * The user is authenticated if there is a currentUser in the context
 *
 * @returns {boolean} - If the currentUser is authenticated
 */
export const isAuthenticated = (context: LambdaContext & CurrentUser) => {
  return !!context.currentUser
}

/**
 * Checks if the currentUser is authenticated (and assigned one of the given roles)
 *
 * @param {string | string[]} roles - A single role or list of roles to check if the user belongs to
 *
 * @returns {boolean} - Returns true if the currentUser is logged in and assigned one of the given roles,
 * or when no roles are provided to check against. Otherwise returns false.
 */
export const hasRole = (
  context: LambdaContext & CurrentUser,
  roles?: string | string[]
) => {
  if (!isAuthenticated(context)) {
    return false
  }

  if (roles) {
    if (Array.isArray(roles)) {
      return context.currentUser.roles?.some((role: string) =>
        roles.includes(role)
      )
    }

    if (typeof roles === 'string') {
      return context.currentUser.roles?.includes(roles)
    }

    // roles not found
    return false
  }

  return true
}
