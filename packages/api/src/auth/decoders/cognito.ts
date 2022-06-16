import jwt, { JwtPayload } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

function verifyCognitoToken(token: string): Promise<null | JwtPayload> {
  return new Promise((resolve, reject) => {
    const { COGNITO_USERPOOL_ID, COGNITO_REGION, COGNITO_CLIENT_ID } =
      process.env
    if (!COGNITO_USERPOOL_ID || !COGNITO_REGION || !COGNITO_CLIENT_ID) {
      throw new Error(
        '`COGNITO_USERPOOL_ID` or `COGNITO_REGION` or `COGNITO_CLIENT_ID` env vars are not set.'
      )
    }

    const client = jwksClient({
      jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USERPOOL_ID}/.well-known/jwks.json`,
    })

    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid as string, (error, key) => {
          callback(error, key?.getPublicKey())
        })
      },
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USERPOOL_ID}`,
      },
      (verifyError, decoded) => {
        const payload = decoded as JwtPayload
        if (verifyError) {
          return reject(verifyError)
        } else if (payload['client_id'] !== COGNITO_CLIENT_ID) {
          return reject(`Invalid client_id. Expected: ${COGNITO_CLIENT_ID}`)
        } else if (payload['token_use'] !== 'access') {
          return reject(`Invalid token_use. Expected: "access"`)
        }
        resolve(typeof decoded === 'undefined' ? null : payload)
      }
    )
  })
}

export const cognito = async (token: any) => {
  const user = await verifyCognitoToken(token)
  let roles = []

  //Extract roles from user groups
  if (user) {
    roles = user['cognito:groups']
  }

  return {
    ...user,
    roles,
  }
}
