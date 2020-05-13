export const config = {
  import: [
    "import { AuthProvider } from '@redwoodjs/auth'",
    "import { Auth0Client } from '@auth0/auth0-spa-js'",
  ],
  init: `const auth0 = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
    redirect_uri: 'http://localhost:8910/',
    cacheLocation: 'localstorage',
    audience: process.env.AUTH0_AUDIENCE,
  })`,
  render: {
    open: '<AuthProvider client={auth0} type="auth0">',
    close: '</AuthProvider>',
  },
}

export const packages = ['@auth0/auth0-spa-js']

export const notes = [
  'You will need to create several environment variables with your Auth0 config options.',
  'Check out web/src/index.js for the variables you need to add.',
  'See: https://auth0.com/docs/quickstart/spa/react#get-your-application-keys',
]
