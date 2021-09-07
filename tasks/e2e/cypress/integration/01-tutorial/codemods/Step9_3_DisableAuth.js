export default `
export const isAuthenticated = () => {
  return true
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
