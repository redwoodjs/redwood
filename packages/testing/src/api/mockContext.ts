import type { CurrentUser } from '@redwoodjs/auth'
import { setContext } from '@redwoodjs/graphql-server'

/**
 * Use this function to mock currentUser in the graphql context.
 *
 * You can set other values in the context using mockGqlContext
 *
 * @param currentUser
 */
export const mockCurrentUser = (currentUser: CurrentUser) => {
  setContext({
    currentUser,
  })
}

// There's really no difference between mocking context and setting context
// But... the tests read way better this way
export const mockGqlContext = setContext
