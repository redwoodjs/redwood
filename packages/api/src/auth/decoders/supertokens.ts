import jwt from 'jsonwebtoken'
import jwksClient, { SigningKey } from 'jwks-rsa'

export const supertokens = async (token: string): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    const { SUPERTOKENS_JWKS_URL } = process.env

    if (SUPERTOKENS_JWKS_URL === undefined) {
      return reject(
        new Error('SUPERTOKENS_JWKS_URL environment variable is not set')
      )
    }

    const client = jwksClient({
      jwksUri: SUPERTOKENS_JWKS_URL,
    })

    function getKey(header: any, callback: jwt.SigningKeyCallback) {
      client.getSigningKey(
        header.kid,
        function (err: Error | null, key: SigningKey) {
          const signingKey = key.getPublicKey()
          callback(err, signingKey)
        }
      )
    }

    jwt.verify(token, getKey, {}, function (err, decoded) {
      if (err) {
        return reject(err)
      }

      decoded = decoded === null ? {} : decoded

      return resolve(decoded)
    })
  })
}
