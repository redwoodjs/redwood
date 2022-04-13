import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

export const auth0Config = () => {
  const { AUTH0_DOMAIN, AUTH0_AUDIENCE } = process.env
  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    throw new Error('`AUTH0_DOMAIN` or `AUTH0_AUDIENCE` env vars are not set.')
  }

  return {
    issuer: `https://${AUTH0_DOMAIN}`,
    audience: AUTH0_AUDIENCE,
  }
}

const auth0Client = () => {
  return jwksClient({
    jwksUri: `${auth0Config().issuer}/.well-known/jwks.json`,
  })
}

export const getSigningKey = async (header: any) => {
  const client = auth0Client() // ?

  const kid = header.kid as string // ?
  const key = await client.getSigningKey(kid) //?
  return key // ?
}

export const getPublicKey = async (header: any) => {
  const key = await getSigningKey(header)
  if (key) {
    return key.getPublicKey()
  } else {
    throw new JsonWebTokenError('JWT Error')
  }
}

/**
 * This takes an auth0 jwt and verifies it. It returns something like this:
 * ```js
 * {
 *   iss: 'https://<AUTH0_DOMAIN>/',
 *   sub: 'auth0|xxx',
 *   aud: [ 'api.billable', 'https://<AUTH0_DOMAIN>/userinfo' ],
 *   iat: 1588800141,
 *   exp: 1588886541,
 *   azp: 'QOsYIlHvCLqLzmfDU0Z3upFdu1znlkqK',
 *   scope: 'openid profile email'
 * }
 * ```
 *
 * You can use `sub` as a stable reference to your user, but  if you want the email
 * address you can set a context object[^0] in rules[^1]:
 *
 * ^0: https://auth0.com/docs/rules/references/context-object
 * ^1: https://manage.auth0.com/#/rules/new
 *
 */

export const verifyAuth0Token = async (
  bearerToken: string
): Promise<null | Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      bearerToken,
      async (header) => {
        return getPublicKey(header)
      },
      {
        audience: auth0Config().audience,
        issuer: auth0Config().issuer,
        algorithms: ['RS256'],
      },
      (verifyError, decoded) => {
        if (verifyError) {
          return reject(verifyError)
        }
        resolve(
          typeof decoded === 'undefined'
            ? null
            : (decoded as Record<string, unknown>)
        )
      }
    )
  })
}

export const auth0 = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  return verifyAuth0Token(token)
}
