# Authentication

`@redwoodjs/auth` is a lightweight wrapper around popular SPA authentication libraries. We currently support the following authentication providers:

- [Netlify Identity Widget](https://github.com/netlify/netlify-identity-widget)
- [Auth0](https://github.com/auth0/auth0-spa-js)
- [Netlify GoTrue-JS](https://github.com/netlify/gotrue-js)
- [Magic Links - Magic.js](https://github.com/MagicHQ/magic-js)
- [Firebase's GoogleAuthProvider](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider)
- [Contribute one](#contributing), it's SuperEasy™!

Check out the [Auth Playground](https://github.com/redwoodjs/playground-auth).

## Installation

### CLI Auth Generator

The following CLI command will install required packages, generate boilerplate code, and files for Redwood Projects:

```terminal
yarn rw g auth [provider]
```

*`[provider]` can be one of: "auth0", "custom", "firebase", "goTrue", "magicLink", or "netlify".

### Manual Installation

+++ Netlify Identity Widget

```bash
cd web
yarn add @redwoodjs/auth netlify-identity-widget
```
+++

+++ Auth0

```bash
cd web
yarn add @redwoodjs/auth @auth0/auth0-spa-js
```
+++

+++ Magic.Link

```bash
cd web
yarn add @redwoodjs/auth magic-sdk
```
+++

+++ GoTrue-JS

```bash
cd web
yarn add @redwoodjs/auth gotrue-js
```
+++

## Setup

Instantiate your authentication client, and pass it to the `<AuthProvider>`:

+++ For Netlify Identity Widget

You will need to enable Identity on your Netlify site. See [Netlify Identity Setup](https://redwoodjs.com/tutorial/authentication#netlify-identity-setup).

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
+++

+++ For GoTrue-JS

You will need to enable Identity on your Netlify site. See [Netlify Identity Setup](https://redwoodjs.com/tutorial/authentication#netlify-identity-setup).

Add the GoTrue-JS package to the web side:

```terminal
yarn workspace web add gotrue-js
```

Instantiate GoTrue and pass in your configuration. Be sure to set APIUrl to the API endpoint found in your Netlify site's Identity tab:

```js
// web/src/index.js
import { AuthProvider } from '@redwoodjs/auth'
import GoTrue from 'gotrue-js'

const goTrue = new GoTrue({
  APIUrl: 'https://MYAPP.netlify.app/.netlify/identity',
  setCookie: true,
})

// in your JSX component
ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={goTrue} type="goTrue">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
```
+++

+++ For Auth0

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
+++

+++ For magic.link

To get your application keys, go to [dashboard.magic.link](https://dashboard.magic.link/) then navigate to the API keys add them to your .env

```js
// web/src/index.js
import { Magic } from 'magic-sdk'

const m = new Magic(process.env.MAGICLINK_PUBLIC)

ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={m} type="magicLink">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>
  </FatalErrorBoundary>,
  document.getElementById('redwood-app')
)
```
+++

+++ For Firebase

We're using [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin), so you'll have to follow the ["Before you begin"](https://firebase.google.com/docs/auth/web/google-signin#before_you_begin) steps in this guide. **Only** follow the "Before you begin" parts.

```js
// web/src/index.js
import * as firebase from 'firebase/app'
import 'firebase/auth'

const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const firebaseClient = ((config) => {
  firebase.initializeApp(config)
  return firebase
})(firebaseClientConfig)

ReactDOM.render(
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={firebaseClient} type="firebase">
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
  const { loading, isAuthenticated, logIn, logOut } = useAuth()

  if (loading) {
    return null
  }

  return (
    <Button
      onClick={async () => {
        if (isAuthenticated) {
          await logOut()
          navigate('/')
        } else {
          await logIn()
        }
      }}
    >
      {isAuthenticated ? 'Log out' : 'Log in'}
    </Button>
  )
}
```
+++

### Auth0 Login and Logout Options

When using the Auth0 client, `login` and `logout` take `options` that can be used to override the client config:

* `returnTo`: a permitted logout url set in Auth0
* `redirectTo`: a target url after login

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

## API

The following values are available from the `useAuth` hook:

* async `logIn()`: Differs based on the client library, with Netlify Identity a pop-up is shown, and with Auth0 the user is redirected
* async `logOut()`: Log out the current user
* `currentUser`: an object containing information about the current user, or `null` if the user is not authenticated
* async `reauthenticate()`: Refetch the authentication data and populate the state.
* async `getToken()`: returns a jwt
* `client`: Access the instance of the client which you passed into `AuthProvider`
* `isAuthenticated`: used to determine if the current user has authenticated
* `hasRole`: used to determine if the current user is assigned a role
* `loading`: The auth state is restored asynchronously when the user visits the site for the first time, use this to determine if you have the correct state

## Usage in Redwood

Redwood provides a zeroconf experience when using our Auth package!

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

Our recommendation is to create a `src/lib/auth.js|ts` file that exports a `getCurrentUser`. (Note: You may already have stub functions.)

```js
import { getCurrentUser } from 'src/lib/auth'
// Example:
//  export const getCurrentUser = async (decoded) => {
//    return await db.user.findOne({ where: { decoded.email } })
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

The value returned by `getCurrentUser` is available in `context.currentUser`

Use `requireAuth` in your services to check that a user is logged in,
whether or not they are assigned a role, and optionally raise an
error if they're not.

```js
export const requireAuth = ({ role }) => {
  if (!context.currentUser) {
    throw new AuthenticationError("You don't have permission to do that.")
  }

  if (
    typeof role !== 'undefined' &&
    !context.currentUser.roles?.includes(role)
  ) {
    throw new ForbiddenError("You don't have access to do that.")
  }
}

```

### API Specific Intergration

### Auth0

If you're using Auth0 you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of a JWT token, and Redwood expects to receive a JWT token.

#### Role-based access control (RBAC)

[Role-based access control (RBAC)](https://auth0.com/docs/authorization/concepts/rbac) refers to the idea of assigning permissions to users based on their role within an organization. It provides fine-grained control and offers a simple, manageable approach to access management that is less prone to error than assigning permissions to users individually.

Essentially, a role is a collection of permissions that you can apply to users. A role might be "admin", "editor" or "publisher". This differs from permissions an example of which might be "publish:blog".

#### App metadata

Auth0 stores information (such as, support plan subscriptions, security roles, or access control groups) in "App metadata". Data stored in `app_metadata` cannot be edited by users.

Create and manage roles for your application in Auth0's "User & Role" management views. You can then assign these roles to users.

However, that info is not immediately available on the user's App metadata or to RedwoodJS when authenticating.

If you assinger your user the "admin" role in Auth0, you will want you user's app_metadata to look like:

```
{
  "roles": [
    "admin"
  ]
}
```

To set this information and make it available to redwoodJS, you can to use [Auth0 Rules](https://auth0.com/docs/rules)..

#### Auth0 Rules for App Metadata

RedwoodJS needs the `app_metadata` to 1) contain the role information and 2) be present in the JWT that is decoded.

To accomplish these tasks, you can use [Auth0 Rules](https://auth0.com/docs/rules) to add them as custom claims on your JWT.

##### Add Authorization Roles to AppMetadata Rule

Your first rule will `Add Authorization Roles to AppMetadata`.

```js
/// Add Authorization Roles to AppMetadata
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

Auth0 maintains user role assignments `context.authorization`. This rule simply copies thate information into the user's `app_metadata`, such as:

```
{
  "roles": [
    "admin"
  ]
}
```

But, now you must include the `app_metdata` on the user's JWT that RedwoodJS will decode.

##### Add AppMetadata to JWT Rule

Therefore, your second rule will `Add AppMetadata to JWT`.

You can add `app_metadata` to the `idToken` or `accessToken`.

Adding to `idToken` will make the make App metadta accessible to RedwoodJS `getuserMetadata` which for Auth0 calls the auth client's `getUser`.

Adding to `accessToken` will make the make App metadta accessible to RedwoodJS when decoding the JWT via `getToken`.

While adding to `idToken` is optional. you *must* add to `accessToken`.

To keep your custom claims from colliding with any reserved claims or claims from other resources, you must give them a [globally unique name using a namespaced format](https://auth0.com/docs/tokens/guides/create-namespaced-custom-claims). Otherwise, Auth0 will *not* add the infomration to the token(s).

Therefore, with a namespace of "https://example.com", the app_metadata on your token should look like:

```js
"https://example.com/app_metadata": {
  "authorization": {
    "roles": [
      "admin"
    ]
  }
},
```

To set this namespace information, use the following function in your rule:

```js
function (user, context, callback) {
  var namespace = 'https://example.com/';

  // adds to idToken, ie userMetadata in RedwoodJS
  context.idToken[namespace + 'app_metadata'] = {};
  context.idToken[namespace + 'app_metadata'].authorization = {
    groups: user.app_metadata.groups,
    roles: user.app_metadata.roles,
    permissions: user.app_metadata.permissions
  };

  context.idToken[namespace + 'user_metadata'] = {};

  // accessToken, ie the decoded JWT in RedwoodJS
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

#### Add Application hasRole Support

If you intend to support, RBAC then in your `api/src/lib/auth.js` you need to extract `roles` using the `parseJWT` utility and set these roles on `currentUser`.

If your roles are on a namespaced app_metadata claim, then `parseJWT` provides an option to provide this value.

```js
// api/src/lib/auth.js`
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

##### Role Protection on Fucntions, Services and Web

You can specify an optional role in `requireAuth` to check if the user is both authenticated and is assigned the role:

```js
export const myThings = () => {
  requireAuth({ role: 'admin'})

  return db.user.findOne({ where: { id: context.currentUser.id } }).things()
}

You can also protect routes:

```
<Router>

  <Private unauthenticated="forbidden" role="admin">
    <Route path="/settings" page={SettingsPage} name="settings" />
    <Route path="/admin" page={AdminPage} name="sites" />
  </Private>

  <Route notfound page={NotFoundPage} />
  <Route path="/forbidden" page={ForbiddenPage} name="forbidden" />
</Router>
```

And also protect content in pages or components via the `userAuth()` hook:

```
const { isAuthenticated, hasRole } = useAuth()

...

{hasRole('admin') && (
  <Link to={routes.admin()}>Admin</Link>
)}
```

### Magic Links

The redwood API does not include the funcionality to decode the magiclinks authentication tokens so the client is inisiated and decodes the tokens inside of `getCurrentUser`.

Magic.link recommends using the issuer as the userID.

```js
// redwood/api/src/lib/auth.ts
import { Magic } from '@magic-sdk/admin'

export const getCurrentUser = async (_decoded, { token }) => {
  const mAdmin = new Magic(process.env.MAGICLINK_SECRET)
  const {
    email,
    publicAddress,
    issuer,
  } = await mAdmin.users.getMetadataByToken(token)

  return await db.user.findOne({ where: { issuer } })
}
```

### Firebase

You must follow the ["Before you begin"](https://firebase.google.com/docs/auth/web/google-signin) part of the "Authenticate Using Google Sign-In with JavaScript" guide.

---

### Routes

Routes can require authentication by wrapping them in a `<Private>` component. An unauthenticated user will be redirected to the page specified in`unauthenticated`.

```js
import { Router, Route, Private } from "@redwoodjs/router"

<Router>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/login" page={LoginPage} name="login" />

  <Private unauthenticated="login">
    <Route path="/admin" page={AdminPage} name="admin" />
    <Route path="/secret-page" page={SecretPage} name="secret" />
  </Private>
</Router>
```

Routes can also be restirected by role by specifying `hasRole(roleName)` in the `<Private>` component. A  user not assigned the role will be redirected to the page specified in`unauthenticated`.

```js
import { Router, Route, Private } from "@redwoodjs/router"

<Router>
  <Route path="/" page={HomePage} name="home" />
  <Route path="/login" page={LoginPage} name="login" />
  <Route path="/forbidden" page={ForbiddenPage} name="login" />

  <Private unauthenticated="login">
    <Route path="/secret-page" page={SecretPage} name="secret" />
  </Private>

  <Private unauthenticated="forbidd4n" hasRole="admin">
    <Route path="/admin" page={AdminPage} name="admin" />
  </Private>
</Router>
```

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
// authClients/index.ts
export type SupportedAuthClients = Auth0 | GoTrue | NetlifyIdentity | MagicLink
```
