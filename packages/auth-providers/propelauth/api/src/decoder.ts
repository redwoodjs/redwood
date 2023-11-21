import { initAuth } from '@propelauth/backend-js-utilities'

export const authDecoder = async (token: string, type: string) => {
  if (type !== 'propelauth-redwoodjs') {
    return null
  }
  const auth = initAuth({
    authUrl: process.env.PROPELAUTH_AUTH_URL ?? '',
    integrationApiKey: process.env.PROPELAUTH_INTEGRATION_API_KEY ?? '',
    verifierKey: process.env.PROPELAUTH_VERIFIER_KEY ?? '',
    applicationUrl: process.env.PROPELAUTH_APPLICATION_URL ?? '',
  })

  return await auth.validation.validateAccessToken(token)
}
