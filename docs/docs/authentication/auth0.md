### Auth0

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```terminal
yarn rw setup auth auth0
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth @auth0/auth0-spa-js
```

#### Setup

To get your application keys, only complete the ["Configure Auth0"](https://auth0.com/docs/quickstart/spa/react#get-your-application-keys) section of the SPA Quickstart guide.

**NOTE** If you're using Auth0 with Redwood then you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of the required JWT token.

The `useRefreshTokens` options is required for automatically extending sessions beyond that set in the initial JWT expiration (often 3600/1 hour or 86400/1 day).

If you want to allow users to get refresh tokens while offline, you must also enable the Allow Offline Access switch in your Auth0 API Settings as part of setup configuration. See: [https://auth0.com/docs/tokens/refresh-tokens](https://auth0.com/docs/tokens/refresh-tokens)

You can increase security by using refresh token rotation which issues a new refresh token and invalidates the predecessor token with each request made to Auth0 for a new access token.

Rotating the refresh token reduces the risk of a compromised refresh token. For more information, see: [https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation](https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation).

> **Including Environment Variables in Serverless Deployment:** in addition to adding the following env vars to your deployment hosting provider, you _must_ take an additional step to include them in your deployment build process. Using the names exactly as given below, follow the instructions in [this document](environment-variables.md) to include them in your `redwood.toml`.

```js
// web/src/App.js
import { AuthProvider } from '@redwoodjs/auth'
import { Auth0Client } from '@auth0/auth0-spa-js'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const auth0 = new Auth0Client({
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
})

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={auth0} type="auth0">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

#### Login and Logout Options

When using the Auth0 client, `login` and `logout` take `options` that can be used to override the client config:

- `returnTo`: a permitted logout url set in Auth0
- `redirectTo`: a target url after login

The latter is helpful when an unauthenticated user visits a Private route, but then is redirected to the `unauthenticated` route. The Redwood router will place the previous requested path in the pathname as a `redirectTo` parameter which can be extracted and set in the Auth0 `appState`. That way, after successfully logging in, the user will be directed to this `targetUrl` rather than the config's callback.

```js
const UserAuthTools = () => {
  const { loading, isAuthenticated, logIn, logOut } = useAuth()

  if (loading) {
    // auth is rehydrating
    return null
  }

  return (
    <Button
      onClick={async () => {
        if (isAuthenticated) {
          await logOut({ returnTo: process.env.AUTH0_REDIRECT_URI })
        } else {
          const searchParams = new URLSearchParams(window.location.search)
          await logIn({
            appState: { targetUrl: searchParams.get('redirectTo') },
          })
        }
      }}
    >
      {isAuthenticated ? 'Log out' : 'Log in'}
    </Button>
  )
}
```

#### Auth0 Auth Provider Specific Setup

See the Auth0 information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.

+++
