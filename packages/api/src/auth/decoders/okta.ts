const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://dev-81077351.okta.com/oauth2/default',
})

// export const verifyOktaToken = (
//   token: any
// ): Promise<null | Record<string, unknown>> => {
//   return new Promise((resolve, reject) => {
//     const { OKTA_DOMAIN, OKTA_AUDIENCE } = process.env
//     if (!OKTA_DOMAIN || !OKTA_AUDIENCE) {
//       throw new Error('`OKTA_DOMAIN` or `OKTA_AUDIENCE` env vars are not set.')
//     }

//     const oktaJwtVerifier = new OktaJwtVerifier({
//       issuer: 'https://{}/oauth1/default',
//     })

//     oktaJwtVerifier
//       .verifyAccessToken(token, 'api://default')
//       .then((jwt) => {
//         console.log(jwt.claims)
//         return jwt
//       })
//       .catch((err) => {
//         throw new Error(err)
//       })
//   })
// }

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
        console.log(res)
        resolve(res.claims as Record<string, unknown>)
      })
  })
}
