import { AuthenticationError } from '@redwoodjs/graphql-server'

import { db } from './db'

// See https://redwoodjs.com/how-to/role-based-access-control-rbac
// for how to add Role-based Access Control (RBAC) here.
//
// !! BEWARE !! Anything returned from this function will be available to the
// client--it becomes the content of `currentUser` on the web side (as well as
// `context.currentUser` on the api side). You should carefully add additional
// fields to the returned object once you've decided they are safe to be
// seen if someone were to open the Web Inspector in their browser.
export const getCurrentUser = async (decoded) => {
  return db.user.findUnique({ where: { address: decoded.address } })
}

/**
 * The user is authenticated if there is a currentUser in the context
 *
 * @returns {boolean} - If the currentUser is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!context.currentUser
}

// Use this function in your services to check that a user is logged in, and
// optionally raise an error if they're not.

export const requireAuth = () => {
  if (!context.currentUser) {
    throw new AuthenticationError("You don't have permission to do that.")
  }
}
