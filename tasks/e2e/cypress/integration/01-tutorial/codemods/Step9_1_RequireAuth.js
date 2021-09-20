export default `
import { ForbiddenError } from '@redwoodjs/graphql-server'

export const isAuthenticated = () => {
  throw new ForbiddenError("I'm sorry, Dave")
}

export const hasRole = ({ roles }) => {
  return roles !== undefined
}

// This is used by the redwood directive
// in ./api/src/directives/requireAuth
export const requireAuth = () => {
  return isAuthenticated()
}

`
