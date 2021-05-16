// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { Auth0Client } from '@auth0/auth0-spa-js'`],
  init: `const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  client_id: process.env.AUTH0_CLIENT_ID,
  redirect_uri: process.env.AUTH0_REDIRECT_URI,

  // ** NOTE ** Storing tokens in browser local storage provides persistence across page refreshes and browser tabs.
  // However, if an attacker can achieve running JavaScript in the SPA using a cross-site scripting (XSS) attack,
  // they can retrieve the tokens stored in local storage.
  // https://auth0.com/docs/libraries/auth0-spa-js#change-storage-options
  cacheLocation: 'localstorage',
  audience: process.env.AUTH0_AUDIENCE,

  // @MARK: useRefreshTokens is required for automatically extending sessions
  // beyond that set in the initial JWT expiration.
  //
  // @MARK: https://auth0.com/docs/tokens/refresh-tokens
  // useRefreshTokens: true,
})`,
  authProvider: {
    client: 'auth0',
    type: 'auth0',
  },
}

// required packages to install
export const webPackages = ['@auth0/auth0-spa-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'You will need to create several environment variables with your Auth0 config options.',
  'Check out web/src/App.{js,tsx} for the variables you need to add.',
  'See: https://auth0.com/docs/quickstart/spa/react#get-your-application-keys',
  '\n',
  "You must also create an API and set the audience parameter, or you'll",
  'receive an opaque token instead of the required JWT token.',
  'See: https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api',
  '\n',
  'If you want to allow users to get refresh tokens while offline,',
  'you must also enable the Allow Offline Access switch in your',
  'Auth0 API Settings as part of setup configuration.',
  'See: https://auth0.com/docs/tokens/refresh-tokens',
  '\n',
  'You can increase security by using refresh token rotation which issues a new refresh token',
  'and invalidates the predecessor token with each request made to Auth0 for a new access token.',
  'Rotating the refresh token reduces the risk of a compromised refresh token.',
  'See: https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation',
]
