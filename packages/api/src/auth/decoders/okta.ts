const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://dev-81077351.okta.com/oauth2/default',
})

export const okta = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  if (!process.env) {
    console.error('env var is not set.')
    throw new Error('env var is not set.')
  }

  return new Promise((resolve) => {
    oktaJwtVerifier
      .verifyAccessToken(token, 'api://default')
      .then((res: any) => {
        resolve(res.claims as Record<string, unknown>)
      })
  })
}
