// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { OktaAuth } from '@okta/okta-auth-js'`],
  init: `
  const okta = new OktaAuth({
    issuer: 'process.env.OKTA_ISSUER',
    clientId: 'process.env.OKTA_CLIENT_ID',
    redirectUri: 'process.env.OKTA_REDIRECT_URI',
    pkce: true,
  })
  `,
  authProvider: {
    client: 'okta',
    type: 'okta',
  },
}

// required packages to install
export const webPackages = ['@okta/okta-auth-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = []
