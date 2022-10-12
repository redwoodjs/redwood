---
sidebar_label: Auth0
---

# Auth0 Authentication

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth auth0
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth @auth0/auth0-spa-js
```

## Setup

To get your application keys, only complete the ["Configure Auth0"](https://auth0.com/docs/quickstart/spa/react#get-your-application-keys) section of the SPA Quickstart guide.

**NOTE** If you're using Auth0 with Redwood then you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of the required JWT token.

The `useRefreshTokens` options is required for automatically extending sessions beyond that set in the initial JWT expiration (often 3600/1 hour or 86400/1 day).

If you want to allow users to get refresh tokens while offline, you must also enable the Allow Offline Access switch in your Auth0 API Settings as part of setup configuration. See: [https://auth0.com/docs/tokens/refresh-tokens](https://auth0.com/docs/tokens/refresh-tokens)

You can increase security by using refresh token rotation which issues a new refresh token and invalidates the predecessor token with each request made to Auth0 for a new access token.

Rotating the refresh token reduces the risk of a compromised refresh token. For more information, see: [https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation](https://auth0.com/docs/tokens/refresh-tokens/refresh-token-rotation).

> **Including Environment Variables in Serverless Deployment:** in addition to adding the following env vars to your deployment hosting provider, you _must_ take an additional step to include them in your deployment build process. Using the names exactly as given below, follow the instructions in [this document](environment-variables.md) to include them in your `redwood.toml`.

```jsx title="web/src/App.js"
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

## Login and Logout Options

When using the Auth0 client, `login` and `logout` take `options` that can be used to override the client config:

- `returnTo`: a permitted logout url set in Auth0
- `redirectTo`: a target url after login

The latter is helpful when an unauthenticated user visits a Private route, but then is redirected to the `unauthenticated` route. The Redwood router will place the previous requested path in the pathname as a `redirectTo` parameter which can be extracted and set in the Auth0 `appState`. That way, after successfully logging in, the user will be directed to this `targetUrl` rather than the config's callback.

```jsx
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

## Integration

If you're using Auth0 you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of a JWT token, and Redwood expects to receive a JWT token.

### Role-Based Access Control (RBAC)

[Role-based access control (RBAC)](https://auth0.com/docs/authorization/concepts/rbac) refers to the idea of assigning permissions to users based on their role within an organization. It provides fine-grained control and offers a simple, manageable approach to access management that is less prone to error than assigning permissions to users individually.

Essentially, a role is a collection of permissions that you can apply to users. A role might be "admin", "editor" or "publisher". This differs from permissions an example of which might be "publish:blog".

### App Metadata

Auth0 stores information (such as, support plan subscriptions, security roles, or access control groups) in `app_metadata`. Data stored in `app_metadata` cannot be edited by users.

Create and manage roles for your application in Auth0's "User & Role" management views. You can then assign these roles to users.

However, that info is not immediately available on the user's `app_metadata` or to RedwoodJS when authenticating.

If you assign your user the "admin" role in Auth0, you will want your user's `app_metadata` to look like:

```
{
  "roles": [
    "admin"
  ]
}
```

To set this information and make it available to RedwoodJS, you can use [Auth0 Rules](https://auth0.com/docs/rules).

### Rules for App Metadata

RedwoodJS needs `app_metadata` to 1) contain the role information and 2) be present in the JWT that is decoded.

To accomplish these tasks, you can use [Auth0 Rules](https://auth0.com/docs/rules) to add them as custom claims on your JWT.

#### Add Authorization Roles to App Metadata Rule

Your first rule will `Add Authorization Roles to App Metadata`.

```jsx
/// Add Authorization Roles to App Metadata
function (user, context, callback) {
    auth0.users.updateAppMetadata(user.user_id, context.authorization)
      .then(function(){
          callback(null, user, context);
      })
      .catch(function(err){
          callback(err);
      });
  }
```

Auth0 exposes the user's roles in `context.authorization`. This rule simply copies that information into the user's `app_metadata`, such as:

```
{
  "roles": [
    "admin"
  ]
}
```

However, now you must include the `app_metadata` on the user's JWT that RedwoodJS will decode.

#### Add App Metadata to JWT Rule

Therefore, your second rule will `Add App Metadata to JWT`.

You can add `app_metadata` to the `idToken` or `accessToken`.

Adding to `idToken` will make the make app metadata accessible to RedwoodJS `getUserMetadata` which for Auth0 calls the auth client's `getUser`.

Adding to `accessToken` will make the make app metadata accessible to RedwoodJS when decoding the JWT via `getToken`.

While adding to `idToken` is optional, you _must_ add to `accessToken`.

To keep your custom claims from colliding with any reserved claims or claims from other resources, you must give them a [globally unique name using a namespaced format](https://auth0.com/docs/tokens/guides/create-namespaced-custom-claims). Otherwise, Auth0 will _not_ add the information to the token(s).

Therefore, with a namespace of "https://example.com", the `app_metadata` on your token should look like:

```jsx
"https://example.com/app_metadata": {
  "authorization": {
    "roles": [
      "admin"
    ]
  }
},
```

To set this namespace information, use the following function in your rule:

```jsx
function (user, context, callback) {
  var namespace = 'https://example.com/';

  // adds to idToken, i.e. userMetadata in RedwoodJS
  context.idToken[namespace + 'app_metadata'] = {};
  context.idToken[namespace + 'app_metadata'].authorization = {
    groups: user.app_metadata.groups,
    roles: user.app_metadata.roles,
    permissions: user.app_metadata.permissions
  };

  context.idToken[namespace + 'user_metadata'] = {};

  // accessToken, i.e. the decoded JWT in RedwoodJS
  context.accessToken[namespace + 'app_metadata'] = {};
  context.accessToken[namespace + 'app_metadata'].authorization = {
    groups: user.app_metadata.groups,
    roles: user.app_metadata.roles,
    permissions: user.app_metadata.permissions
  };

   context.accessToken[namespace + 'user_metadata'] = {};

  return callback(null, user, context);
}
```

Now, your `app_metadata` with `authorization` and `role` information will be on the user's JWT after logging in.

### Application `hasRole` Support

If you intend to support, RBAC then in your `api/src/lib/auth.js` you need to extract `roles` using the `parseJWT` utility and set these roles on `currentUser`.

If your roles are on a namespaced `app_metadata` claim, then `parseJWT` provides an option to provide this value.

```jsx title="api/src/lib/auth.js"
const NAMESPACE = 'https://example.com'

const currentUserWithRoles = async (decoded) => {
  const currentUser = await userByUserId(decoded.sub)
  return {
    ...currentUser,
    roles: parseJWT({ decoded: decoded, namespace: NAMESPACE }).roles,
  }
}

export const getCurrentUser = async (decoded, { type, token }) => {
  try {
    requireAccessToken(decoded, { type, token })
    return currentUserWithRoles(decoded)
  } catch (error) {
    return decoded
  }
}
```
