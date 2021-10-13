# Authentication

## Contributing

Adding a new auth provider is easier than you may expect. The main objective is to map the methods of an instance of your target auth library to a shape that Redwood understands.

Here is the implementation for Auth0:

```ts
// authClients/auth0.ts
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
    logIn: async (options?) => client.loginWithRedirect(options),
    logOut: (options?) => client.logout(options),
    signUp: (options?) => client.signup(options),
    getToken: async () => client.getTokenSilently(),
    currentUser: async () => {
      const user = await client.getUser()
      return user || null
    },
    getUserMetadata: async () => {
      const user = await client.getUser()
      return user || null
    },
  }
}
```

You'll need to import the type definition for you client and add it to the supported auth types:

## Sign Up

Note: Not all AuthProviders support a separate `signUp` authentication flow -- such as for passwordless authentication or authentication with social providers (GitHub, Google, etc). In these cases, `signUp` will perform the same flow as `login()`.

### Auth0 Sign Up

If you want to use the useAuth hook `Sign Up` with Auth0 to default the UI to the sign up "tab", you need to be using the ["New Universal Login Experience"](https://auth0.com/docs/universal-login/new-experience). The "Classic Universal Experience" does not support the `screen_hint` to set the tab.

```ts
// authClients/index.ts
export type SupportedAuthClients =
  | Auth0
  | AzureActiveDirectory
  | Cognito
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | Firebase
  | Supabase
  | Ethereum
  | Nhost
  | Custom
```

## getCurrentUser

`getCurrentUser` returns the user information together with
an optional collection of roles used by requireAuth() to check if the user is authenticated or has role-based access.

Use in conjunction with `requireAuth` in your services to check that a user is logged in, whether or not they are assigned a role, and optionally raise an error if they're not.

```js
@param decoded - The decoded access token containing user info and JWT claims like `sub`
@param { token, SupportedAuthTypes type } - The access token itself as well as the auth provider type
@param { APIGatewayEvent event, Context context } - An object which contains information from the invoker
such as headers and cookies, and the context information about the invocation such as IP Address
```

### Examples

#### Checks if currentUser is authenticated

This example is the standard use of `getCurrentUser`.

```js
export const getCurrentUser = async (decoded, { _token, _type }, { _event, _context }) => {
  return { ...decoded, roles: parseJWT({ decoded }).roles }
}
```

#### User details fetched via database query

```js
export const getCurrentUser = async (decoded) => {
  return await db.user.findUnique({ where: { decoded.email } })
}
```

#### User info is decoded from the access token

```js
export const getCurrentUser = async (decoded) => {
  return { ...decoded }
}
```

#### User info is contained in the decoded token and roles extracted

```js
export const getCurrentUser = async (decoded) => {
  return { ...decoded, roles: parseJWT({ decoded }).roles }
}
```

#### User record query by email with namespaced app_metadata roles as Auth0 requires custom JWT claims to be namespaced

```js
export const getCurrentUser = async (decoded) => {
  const currentUser = await db.user.findUnique({ where: { email: decoded.email } })

  return {
    ...currentUser,
    roles: parseJWT({ decoded: decoded, namespace: NAMESPACE }).roles,
  }
}
```

#### User record query by an identity with app_metadata roles

```js
const getCurrentUser = async (decoded) => {
  const currentUser = await db.user.findUnique({ where: { userIdentity: decoded.sub } })
  return {
    ...currentUser,
    roles: parseJWT({ decoded: decoded }).roles,
  }
}
```

#### Cookies and other request information are available in the req parameter, just in case

```js
const getCurrentUser = async (_decoded, _raw, { event, _context }) => {
  const cookies = cookie(event.headers.cookies)
  const session = cookies['my.cookie.name']
  const currentUser = await db.sessions.findUnique({ where: { id: session } })
  return currentUser
}
```


## requireAuth

 Use `requireAuth` in your services to check that a user is logged in, whether or not they are assigned a role, and optionally raise an error if they're not.

```js
@param {string=} roles - An optional role or list of roles
@param {string[]=} roles - An optional list of roles

@returns {boolean} - If the currentUser is authenticated (and assigned one of the given roles)

@throws {AuthenticationError} - If the currentUser is not authenticated
@throws {ForbiddenError} If the currentUser is not allowed due to role permissions
```

### Examples

#### Checks if currentUser is authenticated

```js
requireAuth()
```

#### Checks if currentUser is authenticated and assigned one of the given roles

```js
 requireAuth({ role: 'admin' })
 requireAuth({ role: ['editor', 'author'] })
 requireAuth({ role: ['publisher'] })
```
