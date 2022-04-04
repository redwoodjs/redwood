// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { OktaAuth } from '@okta/okta-auth-js'`],
  init: `const client = new OktaAuth({
    issuer: 'process.env.OKTA_ISSUER',
    clientId: 'process.env.OKTA_CLIENT_ID',
    redirectUri: 'process.env.OKTA_REDIRECT_URI',
    pkce: true,
  })
  // @MARK: useRefreshTokens is required for automatically extending sessions
  // beyond that set in the initial JWT expiration.
  //
  // @MARK: https://auth0.com/docs/tokens/refresh-tokens
  // useRefreshTokens: true,
})`,
  authProvider: {
    client: 'okta',
    type: 'okta',
  },
}

// required packages to install
export const webPackages = ['@okta/okta-auth-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'You will need to create several environment variables with your Okta config options.',
  'Check out web/src/App.{js,tsx} for the variables you need to add.',
  // 'See: https://auth0.com/docs/quickstart/spa/react#get-your-application-keys',
  '\n',
  "You must also create an API and set the audience parameter, or you'll",
  'receive an opaque token instead of the required JWT token.',
  // 'See: https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api',
  '\n',
  'If you want to allow users to get refresh tokens while offline,',
  'you must also enable the Allow Offline Access switch in your',
  'Auth0 API Settings as part of setup configuration.',
  // 'See: https://auth0.com/docs/tokens/refresh-tokens',
  '\n',
  'You can increase security by using refresh token rotation which issues a new refresh token',
  'and invalidates the predecessor token with each request made to Auth0 for a new access token.',
  'Rotating the refresh token reduces the risk of a compromised refresh token.',
  // 'See: https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation',
]
