# Auth

`@redwoodjs/auth` is a lightweight wrapper around popular SPA authentication libraries. We currently support the following authentication providers:

- [Netlify Identity Widget](https://github.com/netlify/netlify-identity-widget)
- [Auth0](https://github.com/auth0/auth0-spa-js)
- [Netlify GoTrue-JS](https://github.com/netlify/gotrue-js)
- Contribute one, it's "super easy!"

## Installation

### For Netlify Identity Widget

```js
cd web
yarn add @redwoodjs/auth netlify-identity-widget
```

### For Auth0:

```js
cd web
yarn add @redwoodjs/auth @auth0/auth0-spa-js
```

## Setup

Instantiate your authentication library and pass it to the `AuthProvider`:

### For Netlify Identity Widget

```js
// web/src/index.js
import { AuthProvider } from '@redwoodjs/auth'
import netlifyIdentity from 'netlify-identity-widget'

netlifyIdentity.init()

// in your JSX component
ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={netlifyIdentity} type="netlify">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
```

### For Auth0

To get your application keys, only complete the ["Configure Auth0"](https://auth0.com/docs/quickstart/spa/react#get-your-application-keys) section of the SPA Quickstart guide.

**NOTE** If you're using Auth0 with Redwood then you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of the required JWT token.

```js
// web/src/index.js
import { AuthProvider } from '@redwoodjs/auth'
import { Auth0Client } from '@auth0/auth0-spa-js'

const auth0 = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
    redirect_uri: 'http://localhost:8910/',
    cacheLocation: 'localstorage',
    audience: process.env.AUTH0_AUDIENCE,
})

ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={auth0} type="auth0">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
```

## Usage

```js
const UserAuthTools = () => {
  const { loading, authenticated, login, logout } = useAuth()

  if (loading) {
    // auth is rehydrating
    return null
  }

  return (
    <Button
      onClick={async () => {
        if (authenticated) {
          await logout()
          navigate('/')
        } else {
          await login()
        }
      }}
    >
      {authenticated ? 'Logout' : 'Login'}
    </Button>
  )
}
```

## API

The following values are available from the `useAuth` hook:

* async `login()`: Differs based on the client library, with Netlify Identity a pop-up is shown, and with Auth0 the user is redirected
* async `logout()`: Log out the current user
* `currentUser`: an object containing information about the current user, or `null` if the user is not authenticated
* async `getToken()`: returns a jwt
* `client`: Access the instance of the client which you passed into `AuthProvider`
* `authenticated`: used to determine if the current user has authenticated
* `loading`: The auth state is restored asynchronously when the user visits the site for teh first time, use this to determine if you have the correct state

## Usage in Redwood

Redwood providers a zeroconf experience when using our Auth package!

### GraphQL Query and Mutations

GraphQL requests automatically receive an `Authorization` JWT header when a user is authenticated.

### API

If a user is signed in, the `Authorization` token is verified, decoded and available in `context.currentUser`

```js
import { context }  from '@redwoodjs/api'

console.log(context.currentUser)
// {
//    sub: '<netlify-id>
//    email: 'user@example.com',
//    [...]
// }
```

You can map the "raw decoded JWT" into a real user object by passing a `getCurrentUser` function to `createCreateGraphQLHandler`

Our recommendation is to create a `src/lib/auth.js|ts` file that exports a `getCurrentUser` function (You may already have a stub function.)

```js
import { getCurrentUser } from 'src/lib/auth'
// Example:
//  export const getCurrentUser = async (authToken: { email }) => {
//    return await db.user.findOne({ where: { email } })
//  }
``

export const handler = createGraphQLHandler({
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
  getCurrentUser,
})
```

The value returned by `getCurrentUser` is available in `context.currentUser`

**NOTE** If you're using Auth0 you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of a JWT token, and Redwood expects to receive a JWT token.

### Routes

Routes can require authentication by wrapping them in a `<Private>` component. An  unauthenticated user will be redirected to the page specified in`unauthorized`.

```js
import { Router, Route, Private } from "@redwoodjs/router"

<Router>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/login" page={LoginPage} name="login" />

  <Private unauthorized="login">
    <Route path="/admin" page={AdminPage} name="admin" />
    <Route path="/secret-page" page={SecretPage} name="secret" />
  </Private>
</Router>
```

## Contributing

Adding a new auth provider is easier than you may expect. The main objective is to map the methods of an instance of your target auth library to a shape that Redwood understands.

Here is the implementation for Auth0:

```ts
// authClients.ts
const mapAuthClientAuth0 = (client: Auth0): AuthClientAuth0 => {
  return {
    type: 'auth0',
    client,
    restoreAuthState: async () => {
      if (window.location.search.includes('code=')) {
        const { appState } = await client.handleRedirectCallback()
        window.history.replaceState(
          {},
          document.title,
          appState && appState.targetUrl
            ? appState.targetUrl
            : window.location.pathname
        )
      }
    },
    login: async () => client.loginWithRedirect(),
    logout: () => client.logout(),
    getToken: async () => client.getTokenSilently(),
    currentUser: async () => {
      const user = await client.getUser()
      return user || null
    },
  }
}
```

You'll need to import the type definition for you client and add it to the supported auth types:

```ts
// authClients.ts
export type SupportedAuthClients = Auth0 | GoTrue | NetlifyIdentity
export type SupportedAuthTypes = 'auth0' | 'gotrue' | 'netlify'
```
