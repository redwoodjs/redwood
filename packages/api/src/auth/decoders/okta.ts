const OktaJwtVerifier = require('@okta/jwt-verifier')

export const okta = async (
  token: string
): Promise<null | Record<string, unknown>> => {
  const { OKTA_DOMAIN, OKTA_AUDIENCE } = process.env
  if (!OKTA_AUDIENCE || !OKTA_DOMAIN) {
    throw new Error('`OKTA_DOMAIN` or `OKTA_AUDIENCE` env vars are not set.')
  }

  const client = new OktaJwtVerifier({
    issuer: `https://${OKTA_DOMAIN}/oauth2/default`,
  })

  return new Promise((resolve) => {
    client
      .verifyAccessToken(token, process.env.OKTA_AUDIENCE)
      .then((res: any) => {
        resolve(res.claims as Record<string, unknown>)
      })
  })
}
