---
description: Set up an authentication provider
---

# Authentication

Redwood has integrated auth end to end, from the web side to the api side.
On the web side, the router can protect pages via the `Private` component (or the `Set` component via the `private` prop), and even restrict access at the role-level.
And if you'd prefer to work with the primitives, the `useAuth` hook exposes all the pieces to build the experience you want.

Likewise, the api side is locked down by default: all SDLs are generated with the `@requireAuth` directive, ensuring that making things publicly available is something that you opt into rather than out of.
You can also require auth anywhere in your Services, and even in your server-ful or -less functions.

Last but not least, Redwood provides it's own auth provider: [dbAuth](./auth/dbauth.md).

In this doc, we'll cover auth in Redwood at a high level.
All auth providers share the same interface so the information here will be useful no matter which auth provider you use.

## Official integrations

When you're ready to add auth to your app, there's a great list of providers to choose from, and if you don't see the one you like, you can integrate it via a simple API:

- [Auth0](./auth/auth0.md)
- [Azure Active Directory](./auth/azure.md)
- [Clerk](./auth/clerk.md)
- [Firebase](./auth/firebase.md)
- [Netlify](./auth/netlify.md)
- [Supabase](./auth/supabase.md)
- SuperTokens

:::tip how to tell if an integration is official

Look for the `@redwoodjs` scope to tell if an integration is official.
For example, Redwood's Auth0 integration comprises two npm packages: `@redwoodjs/auth-auth0-web` and `@redwoodjs/auth-auth0-api`.

:::

Other than bearing the `@redwoodjs` scope, the reason these providers are official is that we're committed to keeping them up to date.
You can set up any of them via the corresponding auth setup command:

```
yarn rw setup auth auth0
```

## The API at a high-level

We mentioned that Redwood has a simple API you can use to integrate any provider you want.
Let's dive into it here.

On the web side, there are two components that can be auth enabled: the `RedwoodApolloProvider` in `web/src/App.tsx` and the `Router` in `web/src/Routes.tsx`.
Both take a `useAuth` prop. If provided, they'll use this hook to get information about the app's auth state. The `RedwoodApolloProvider` will use it to get a token to include in every GraphQL request, and the Router will use it to determine if a user has access a route.

When you set up an auth provider, the setup command makes a new file, `web/src/auth.ts`. This file's job is to make the `AuthProvider` and `useAuth` hook by integrating with the auth provider of your choice. Whenever you need access to the auth context, you'll import the `useAuth` hook from this file. The `RedwoodApolloProvider` and `Router` are no exception:

![web-side-auth](https://user-images.githubusercontent.com/32992335/208549951-469617d7-c798-4d9a-8a29-46efe23cca6a.png)

Once auth is setup on the web side, every GraphQL request includes a JWT.
The api side needs a way of verifying and decoding this token if it's to do anything with it.
There's two steps to this process:

- decoding the token
- mapping it into a user object

The `createGraphQLHandler` in `api/src/functions/graphql.ts` takes two props, `authDecoder` and `getCurrentUser`, for each of these steps (respectively):

```ts title="api/src/functions/graphql.ts"
// highlight-next-line
import { authDecoder } from '@redwoodjs/auth-auth0-api'
import { createGraphQLHandler } from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

// highlight-next-line
import { getCurrentUser } from 'src/lib/auth'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = createGraphQLHandler({
  // highlight-start
  authDecoder,
  getCurrentUser,
  // highlight-end
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
```

### Destructuring the `useAuth` hook

The `useAuth` hook provides a streamlined interface to your auth provider's client SDK.
Much of what the functions it returns does is self explanatory, but the options they take depend on the auth provider:

| Name              | Description                                                                                                                                                                 |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client`          | The client instance used in creating the auth provider                                                                                                                      |
| `currentUser`     | An object containing information about the current user as set on the `api` side, or if the user isn't authenticated, `null`                                                |
| `getToken`        | Returns a JWT                                                                                                                                                               |
| `hasRole`         | Determines if the current user is assigned a role like `"admin"` or assigned to any of the roles in a list                                                                  |
| `isAuthenticated` | A boolean indicating whether or not the user is authenticated                                                                                                               |
| `loading`         | If auth is loading                                                                                                                                                          |
| `logIn`           | Logs a user in                                                                                                                                                              |
| `logOut`          | Logs a user out                                                                                                                                                             |
| `reauthenticate`  | Refetch auth data and context                                                                                                                                               |
| `signUp`          | Signs a user up                                                                                                                                                             |
| `userMetadata`    | An object containing the user's metadata (or profile information) fetched directly from an instance of the auth provider client, or if the user isn't authenticated, `null` |

### Protecting routes

You can require that a user be authenticated to navigate to a route by wrapping it in the `Private` component.
An unauthenticated user will be redirected to the route specified in the `Private` component's `unauthenticated` prop:

```tsx
import { Router, Route, Private } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />

      // highlight-next-line
      <Private unauthenticated="login">
        <Route path="/admin" page={AdminPage} name="admin" />
        <Route path="/secret-page" page={SecretPage} name="secret" />
      </Private>
    </Router>
  )
}
```

You can also restrict access by role by passing a role or an array of roles to the `Private` component's `hasRole` prop:

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

      // highlight-next-line
      <Set private unauthenticated="forbidden" hasRole="admin">
        <Route path="/admin" page={AdminPage} name="admin" />
      </Set>

      // highlight-next-line
      <Private unauthenticated="forbidden" hasRole={['author', 'editor']}>
        <Route path="/posts" page={PostsPage} name="posts" />
      </Private>
    </Router>
  )
}
```

### api-side currentUser

We briefly mentioned that GraphQL requests include an `Authorization` header in every request when a user is authenticated.
The api side verifies and decodes the token in this header via the `authDecoder` function.
While information about the user is technically available at this point, it's still pretty raw.
You can map it into a real user object via the `getCurrentUser` function.
Both these functions are passed to the `createGraphQLHandler` function.

`getCurrentUser`'s return is made globally available in the api's context via `context.currentUser` for convenience.

### Locking down the GraphQL api

Use the `requireAuth` and `skipAuth` [GraphQL directives](directives#secure-by-default-with-built-in-directives) to provide protection to individual GraphQL calls.
