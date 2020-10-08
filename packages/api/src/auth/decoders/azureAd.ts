import jwt from 'jsonwebtoken'

export const azureAd = (token: string) => {
  // @todo: JWT validation
  const decoded = jwt.decode(token)
  return decoded
}
