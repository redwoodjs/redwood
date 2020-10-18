import jwt from 'jsonwebtoken'

export const azureActiveDirectory = (token: string) => {
  // @todo: JWT validation
  const decoded = jwt.decode(token)
  return decoded
}
