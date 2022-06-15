import jwt, { JwtPayload } from 'jsonwebtoken'
export const cognito = (token: string): string | JwtPayload | null => {
  return jwt.decode(token)
}
