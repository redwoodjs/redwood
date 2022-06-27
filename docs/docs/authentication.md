---
description: Set up an authentication provider
---

# Authentication

`@redwoodjs/auth` contains both a built-in database-backed authentication system (dbAuth), as well as lightweight wrappers around popular SPA authentication libraries.

We currently support the following third-party authentication providers:

- Auth0 _([Repo on GitHub](https://github.com/auth0/auth0-spa-js))_
- Azure Active Directory _([Repo on GitHub](https://github.com/AzureAD/microsoft-authentication-library-for-js))_
- Clerk _([Website](https://clerk.dev))_
- Firebase _([Documentation Website](https://firebase.google.com/docs/auth))_
- Magic Links - Magic.js _([Repo on GitHub](https://github.com/MagicHQ/magic-js))_
- Netlify Identity _([Repo on GitHub](https://github.com/netlify/netlify-identity-widget))_
- Netlify GoTrue-JS _([Repo on GitHub](https://github.com/netlify/gotrue-js))_
- Nhost _([Documentation Website](https://docs.nhost.io/platform/authentication))_
- Supabase _([Documentation Website](https://supabase.io/docs/guides/auth))_
- WalletConnect _([Repo on GitHub](https://github.com/oneclickdapp/ethereum-auth))_

You can also implement your own custom auth client. Check out the [Custom docs](auth/custom) for more info.

:::info Auth Playground

Check out the [Auth Playground](https://redwood-playground-auth.netlify.app/) for examples of the auth experience with each provider or check out [the source code](https://redwood-playground-auth.netlify.app/).

:::

## Auth Installation and Setup

You will need to instantiate your authentication client and pass it to the `<AuthProvider>`. See individual auth docs in the menu for your specific provider.

## Authentication on the Web Side

Once your auth provider is set up you'll get access to the various authentication variables and functions by destructuring them from the `useAuth` hook:

```jsx
import { useAuth } from '@redwoodjs/auth'

export const MyComponent = () => {
  const { currentUser, isAuthenticated, logIn, logOut } = useAuth()

  return (
    <ul>
      <li>The current user is: {currentUser}</li>
      <li>Is the user logged in? {isAuthenticated}</li>
      <li>Click to <button type="button" onClick={logIn}>login</button></li>
      <li>Click to <button type="button" onClick={logOut}>logout</button></li>
    </ul>
  )
}
```

The following variables and functions are available from the `useAuth` hook:

- async `logIn(options?)`: Differs based on the client library, with Netlify Identity a pop-up is shown, and with Auth0 the user is redirected. Options are passed to the client.
- async `logOut(options?)`: Log the current user out. Options are passed to the client.
- async `signUp(options?)`: If the provider has a sign up flow we'll show that, otherwise we'll fall back to the logIn flow.
- `currentUser`: An object containing information about the current user as set on the `api` side, or `null` if the user is not authenticated.
- `userMetadata`: An object containing the user's metadata (or profile information) fetched directly from an instance of the auth provider client, or `null` if the user is not authenticated.
- async `reauthenticate()`: Refetch the authentication data and populate the state.
- async `getToken()`: Returns a JWT.
- `client`: Access the instance of the client which you passed into `AuthProvider`.
- `isAuthenticated`: Determines if the current user has authenticated.
- `hasRole(['admin'])`: Determines if the current user is assigned a role like `"admin"` or assigned to any of the roles in a list such as `['editor', 'author']`.
- `loading`: The auth state is restored asynchronously when the user visits the site for the first time, use this to determine if you have the correct state.

### Role Protection

The `hasRole()` function can be used to implement basic role-based authorization control (RBAC). This assumes that your `getCurrentUser()` function adds a `roles` property to the returned object.

```jsx
export const MyComponent = () => {
  const { isAuthenticated, hasRole } = useAuth()

  return (
    <>
      {hasRole('admin') && (
        <Link to={routes.admin()}>Admin</Link>
      )}

      {hasRole(['author', 'editor']) && (
        <Link to={routes.posts()}>Admin</Link>
      )}
    </>
  )
}
```

### Route Protection

Routes can require authentication by wrapping them in a `<Private>` component. An unauthenticated user will be redirected to the page specified in `unauthenticated`.

```jsx
import { Router, Route, Private } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />

      <Private unauthenticated="login">
        <Route path="/admin" page={AdminPage} name="admin" />
        <Route path="/secret-page" page={SecretPage} name="secret" />
      </Private>
    </Router>
  )
}
```

Routes and Sets can also be restricted by role by specifying `hasRole="role"` or `hasRole={['role', 'another_role']})` in the `<Private>` component. A user not assigned the role will be redirected to the page specified in `unauthenticated`.

```jsx
import { Router, Route, Private } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/forbidden" page={ForbiddenPage} name="forbidden" />

      <Private unauthenticated="login">
        <Route path="/secret-page" page={SecretPage} name="secret" />
      </Private>

      <Set private unauthenticated="forbidden" roles="admin">
        <Route path="/admin" page={AdminPage} name="admin" />
      </Set>

      <Private unauthenticated="forbidden" roles={['author', 'editor']}>
        <Route path="/posts" page={PostsPage} name="posts" />
      </Private>
    </Router>
  )
}
```

## Authentication on the API Side

GraphQL requests automatically receive an `Authorization` header when a user is authenticated and Redwood will decode and verify the header, making the user available (if they are logged in) in `context.currentUser`.

```jsx
import { context } from '@redwoodjs/api'

console.log(context.currentUser)
// {
//    sub: '<netlify-id>
//    email: 'user@example.com',
//    [...]
// }
```

You can map the "raw decoded JWT" into a real user object by passing a `getCurrentUser` function to `createGraphQLHandler`

Our recommendation is to create a `src/lib/auth.js|ts` file that exports a `getCurrentUser`. (Note: You may already have stub functions.)

```jsx
import { getCurrentUser } from 'src/lib/auth'
// Example:
//  export const getCurrentUser = async (decoded) => {
//    return await db.user.findUnique({ where: { decoded.email } })
//  }
//

export const handler = createGraphQLHandler({
  schema: makeMergedSchema({
    schemas,
    services: makeServices({ services }),
  }),
  getCurrentUser,
})
```

The value returned by `getCurrentUser()` is available in `context.currentUser`

Use the `requireAuth` and `skipAuth` [GraphQL directives](directives#secure-by-default-with-built-in-directives) to provide protection to individual GraphQL calls.

## Contributing

If you are interested in contributing to the Redwood Auth Package, please [start here](https://github.com/redwoodjs/redwood/blob/main/packages/auth/README.md).
