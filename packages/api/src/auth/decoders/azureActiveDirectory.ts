import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const verifyAzureActiveDirectoryToken = (
  bearerToken: string
): Promise<null | Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    const { AZURE_ACTIVE_DIRECTORY_AUTHORITY } = process.env
    if (!AZURE_ACTIVE_DIRECTORY_AUTHORITY) {
      throw new Error('`AZURE_ACTIVE_DIRECTORY_AUTHORITY` env var is not set.')
    }

    /** @docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc#sample-response */
    const client = jwksClient({
      jwksUri: `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/discovery/v2.0/keys`,
    })

    jwt.verify(
      bearerToken,
      (header, callback) => {
        client.getSigningKey(header.kid as string, (error, key) => {
          try {
            callback(error, key.getPublicKey())
          } catch (err) {
            console.error(
              'An error occurred while trying to obtain signing key from Azure Active Directory. This might be a result of an outage. See https://status.azure.com/en-us/status for current status.',
              err
            )
          }
        })
      },
      {
        issuer: `${AZURE_ACTIVE_DIRECTORY_AUTHORITY}/v2.0`,
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

export const azureActiveDirectory = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  return verifyAzureActiveDirectoryToken(token)
}
