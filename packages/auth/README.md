# Auth

`@redwoodjs/auth` is a lightweight wrapper for popular single-page-app authentication libraries. We support [Netlify Identity Widget](https://github.com/netlify/netlify-identity-widget), [Auth0](https://github.com/auth0/auth0-spa-js) and [Netlify GoTrue-JS](https://github.com/netlify/gotrue-js).

## Installation

### For Netlify Identity Widget:
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

Instantiate your authentication library and pass it along to the `AuthProvider`:

### For Netlify Identity Widget

```js
import { AuthProvider } from '@redwoodjs/auth'
import netlifyIdentity from 'netlify-identity-widget'

netlifyIdentity.init()

// in your JSX component
ReactDOM.render(
    <AuthProvider client={netlifyIdentity} type="netlify">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>,
  document.getElementById('redwood-app')
)
```

### For Auth0

In order to get your application keys, only complete the ["Configure Auth0"](https://auth0.com/docs/quickstart/spa/react#get-your-application-keys) section of the SPA Quickstart guide.

**NOTE** If you're using Auth0 with Redwood then you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter or you'll receive an opaque token instead of the required JWT token.

```js
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
    <AuthProvider client={netlifyIdentity} type="netlify">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>,
  document.getElementById('redwood-app')
)
```

## Usage

We provide a hooks based interface to `AuthProvider`'s context:

```js
const UserAuthTools = () => {
  const { loading, authenticated, login, logout } = useAuth()

  if (loading) {
    // auth it booting...
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
      {authenticated ? 'Log out' : 'Log in'}
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
* `loading`: The auth state is restored asynchronously, use this to determine if you have the correct state

## Usage in Redwood

Redwood offers a zeroconf experience when using our Auth package!

### GraphQL Query and Mutations

Requests to GraphQL automatically receive an `Authorization` bearer token header once you're signed in, the `context` on an API project will contain the `currentUser` which is a decoded and verified version of the JWT.

**NOTE** If you're using Auth0 you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter or you'll receive an opaque token instead of a JWT token, and Redwood expects to receive a JWT token.

### Routes

Routes can be marked as require an authenticated user by wrapping them in `PrivateRoute` rather than `Route`. If a user is not authenticated they will be redirected to the route marked as `unauthorized`.

```js
<Router>
  <Route unauthorized path="/" page={HomePage} name="home" />
  <PrivateRoute path="/admin" page={AdminPage} name="admin" />
</Router>
```
