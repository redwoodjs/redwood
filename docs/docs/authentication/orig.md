# Orig

## Third Party Providers Installation and Setup

You will need to instantiate your authentication client and pass it to the `<AuthProvider>`. See instructions below for your specific provider.

## API

The following values are available from the `useAuth` hook:

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

## Usage in Redwood

Redwood provides a zeroconf experience when using our Auth package!

### GraphQL Query and Mutations

GraphQL requests automatically receive an `Authorization` JWT header when a user is authenticated.

### Auth Provider API

If a user is signed in, the `Authorization` token is verified, decoded and available in `context.currentUser`

```js
import { context } from '@redwoodjs/api'

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

The value returned by `getCurrentUser` is available in `context.currentUser`

Use `requireAuth` in your services to check that a user is logged in,
whether or not they are assigned a role, and optionally raise an
error if they're not.

```js
export const requireAuth = ({ roles }) => {
  if (!isAuthenticated()) {
    throw new AuthenticationError("You don't have permission to do that.")
  }

  if (roles && !hasRole(roles)) {
    throw new ForbiddenError("You don't have access to do that.")
  }
}}
}
```

### Auth Provider Specific Integration

#### Auth0

If you're using Auth0 you must also [create an API](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api#create-an-api) and set the audience parameter, or you'll receive an opaque token instead of a JWT token, and Redwood expects to receive a JWT token.

+++ View Auth0 Options

#### Role-based access control (RBAC) in Auth0

[Role-based access control (RBAC)](https://auth0.com/docs/authorization/concepts/rbac) refers to the idea of assigning permissions to users based on their role within an organization. It provides fine-grained control and offers a simple, manageable approach to access management that is less prone to error than assigning permissions to users individually.

Essentially, a role is a collection of permissions that you can apply to users. A role might be "admin", "editor" or "publisher". This differs from permissions an example of which might be "publish:blog".

#### App metadata in Auth0

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

#### Auth0 Rules for App Metadata

RedwoodJS needs `app_metadata` to 1) contain the role information and 2) be present in the JWT that is decoded.

To accomplish these tasks, you can use [Auth0 Rules](https://auth0.com/docs/rules) to add them as custom claims on your JWT.

#### Add Authorization Roles to App Metadata Rule

Your first rule will `Add Authorization Roles to App Metadata`.

```js
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

#### Add App Metadata to JWT Rule in Auth0

Therefore, your second rule will `Add App Metadata to JWT`.

You can add `app_metadata` to the `idToken` or `accessToken`.

Adding to `idToken` will make the make app metadata accessible to RedwoodJS `getUserMetadata` which for Auth0 calls the auth client's `getUser`.

Adding to `accessToken` will make the make app metadata accessible to RedwoodJS when decoding the JWT via `getToken`.

While adding to `idToken` is optional, you _must_ add to `accessToken`.

To keep your custom claims from colliding with any reserved claims or claims from other resources, you must give them a [globally unique name using a namespaced format](https://auth0.com/docs/tokens/guides/create-namespaced-custom-claims). Otherwise, Auth0 will _not_ add the information to the token(s).

Therefore, with a namespace of "https://example.com", the `app_metadata` on your token should look like:

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

#### Add Application hasRole Support in Auth0

If you intend to support, RBAC then in your `api/src/lib/auth.js` you need to extract `roles` using the `parseJWT` utility and set these roles on `currentUser`.

If your roles are on a namespaced `app_metadata` claim, then `parseJWT` provides an option to provide this value.

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

+++

#### Magic.Link

The Redwood API does not include the functionality to decode Magic.link authentication tokens, so the client is initiated and decodes the tokens inside of `getCurrentUser`.

+++ View Magic.link Options

##### Installation

First, you must manually install the **Magic Admin SDK** in your project's `api/package.json`.

```terminal
yarn workspace api add @magic-sdk/admin
```

##### Setup

To get your application running _without setting up_ `Prisma`, get your `SECRET KEY` from [dashboard.magic.link](https://dashboard.magic.link/). Then add `MAGICLINK_SECRET` to your `.env`.

```js
// redwood/api/src/lib/auth.js|ts
import { Magic } from '@magic-sdk/admin'

export const getCurrentUser = async (_decoded, { token }) => {
  const mAdmin = new Magic(process.env.MAGICLINK_SECRET)

  return await mAdmin.users.getMetadataByToken(token)
}
```

Magic.link recommends using the issuer as the userID to retrieve user metadata via `Prisma`

```js
// redwood/api/src/lib/auth.ts
import { Magic } from '@magic-sdk/admin'

export const getCurrentUser = async (_decoded, { token }) => {
  const mAdmin = new Magic(process.env.MAGICLINK_SECRET)
  const { email, publicAddress, issuer } = await mAdmin.users.getMetadataByToken(token)

  return await db.user.findUnique({ where: { issuer } })
}
```

+++

#### Firebase

You must follow the ["Before you begin"](https://firebase.google.com/docs/auth/web/google-signin) part of the "Authenticate Using Google Sign-In with JavaScript" guide.

+++ View Firebase Options

#### Role-based access control (RBAC) in Firebase

Requires a custom implementation.

#### App metadata in Firebase

None.

#### Add Application hasRole Support in Firebase

Requires a custom implementation.

#### Auth Providers

Providers can be configured by specifying `logIn(provider)` and `signUp(provider)`, where `provider` is a **string** of one of the supported providers.

Supported providers:

- google.com (Default)
- facebook.com
- github.com
- twitter.com
- microsoft.com
- apple.com

#### Email & Password Auth in Firebase

Email/password authentication is supported by calling `login({ email, password })` and `signUp({ email, password })`.

#### Email link (passwordless sign-in) in Firebase

In Firebase Console, you must enable "Email link (passwordless sign-in)" with the configuration toggle for the email provider. The authentication sequence for passwordless email links has two steps:

1. First, an email with the link must be generated and sent to the user. Either using using firebase client sdk (web side) [sendSignInLinkToEmail()](https://firebase.google.com/docs/reference/js/auth.emailauthprovider#example_2_2), which generates the link and sends the email to the user on behalf of your application or alternatively, generate the link using backend admin sdk (api side), see ["Generate email link for sign-in](https://firebase.google.com/docs/auth/admin/email-action-links#generate_email_link_for_sign-in) but it is then your responsibility to send an email to the user containing the link.
2. Second, authentication is completed when the user is redirected back to the application and the AuthProvider's logIn({emailLink, email, providerId: 'emailLink'}) method is called.

For example, users could be redirected to a dedicated route/page to complete authentication:

```js
import { useEffect } from 'react'
import { Redirect, routes } from '@redwoodjs/router'
import { useAuth } from '@redwoodjs/auth'

const EmailSigninPage = () => {
  const { loading, hasError, error, logIn } = useAuth()

  const email = window.localStorage.getItem('emailForSignIn')
  // TODO: Prompt the user for email if not found in local storage, for example
  // if the user opened the email link on a different device.

  const emailLink = window.location.href

  useEffect(() => {
    logIn({
      providerId: 'emailLink',
      email,
      emailLink,
    })
  }, [])

  if (loading) {
    return <div>Auth Loading...</div>
  }

  if (hasError) {
    console.error(error)
    return <div>Auth Error... check console</div>
  }

  return <Redirect to={routes.home()} />
}

export default EmailSigninPage
```

#### Custom Token in Firebase

If you want to [integrate firebase auth with another authentication system](https://firebase.google.com/docs/auth/web/custom-auth), you can use a custom token provider:

```js
logIn({
  providerId: 'customToken',
  customToken,
})
```

Some caveats about using custom tokens:

- make sure it's actually what you want to use
- remember that the client's firebase authentication state has an independent lifetime than the custom token

If you want to read more, check out [Demystifying Firebase Auth Tokens](https://medium.com/@jwngr/demystifying-firebase-auth-tokens-e0c533ed330c).

#### Custom Parameters & Scopes for Google OAuth Provider

Both `logIn()` and `signUp()` can accept a single argument of either a **string** or **object**. If a string is provided, it should be any of the supported providers (see above), which will configure the defaults for that provider.

`logIn()` and `signUp()` also accept a single a configuration object. This object accepts `providerId`, `email`, `password`, and `scope` and `customParameters`. (In fact, passing in any arguments ultimately results in this object). You can use this configuration object to pass in values for the optional Google OAuth Provider methods _setCustomParameters_ and _addScope_.

Below are the parameters that `logIn()` and `signUp()` accept:

- `providerId`: Accepts one of the supported auth providers as a **string**. If no arguments are passed to `login() / signUp()` this will default to 'google.com'. Provider strings passed as a single argument to `login() / signUp()` will be cast to this value in the object.
- `email`: Accepts a **string** of a users email address. Used in conjunction with `password` and requires that Firebase has email authentication enabled as an option.
- `password`: Accepts a **string** of a users password. Used in conjunction with `email` and requires that Firebase has email authentication enabled as an option.
- `scope`: Accepts an **array** of strings ([Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)), which can be added to the requested Google OAuth Provider. These will be added using the Google OAuth _addScope_ method.
- `customParameters`: accepts an **object** with the [optional parameters](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters) for the Google OAuth Provider _setCustomParameters_ method. [Valid parameters](https://developers.google.com/identity/protocols/oauth2/openid-connect#authenticationuriparameters) include 'hd', 'include_granted_scopes', 'login_hint' and 'prompt'.

#### Firebase Auth Examples

- `logIn()/signUp()`: Defaults to Google provider.
- `logIn({providerId: 'github.com'})`: Log in using GitHub as auth provider.
- `signUp({email: "someone@email.com", password: 'some_good_password'})`: Creates a firebase user with email/password.
- `logIn({email: "someone@email.com", password: 'some_good_password'})`: Logs in existing firebase user with email/password.
- `logIn({scopes: ['https://www.googleapis.com/auth/calendar']})`: Adds a scope using the [addScope](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#addscope) method.
- `logIn({ customParameters: { prompt: "consent" } })`: Sets the OAuth custom parameters using [setCustomParameters](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#addscope) method.

+++

#### Netlify Identity

[Netlify Identity](https://docs.netlify.com/visitor-access/identity) offers [Role-based access control (RBAC)](https://docs.netlify.com/visitor-access/identity/manage-existing-users/#user-account-metadata).

+++ View Netlify Identity Options

#### Role-based access control (RBAC) in Netlify Identity

Role-based access control (RBAC) refers to the idea of assigning permissions to users based on their role within an organization. It provides fine-grained control and offers a simple, manageable approach to access management that is less prone to error than assigning permissions to users individually.

Essentially, a role is a collection of permissions that you can apply to users. A role might be "admin", "editor" or "publisher". This differs from permissions an example of which might be "publish:blog".

#### App metadata in Netlify Identity

Netlify Identity stores information (such as, support plan subscriptions, security roles, or access control groups) in `app_metadata`. Data stored in `app_metadata` cannot be edited by users.

Create and manage roles for your application in Netlify's "Identity" management views. You can then assign these roles to users.

#### Add Application hasRole Support in Netlify Identity

If you intend to support, RBAC then in your `api/src/lib/auth.js` you need to extract `roles` using the `parseJWT` utility and set these roles on `currentUser`.

Netlify will store the user's roles on the `app_metadata` claim and the `parseJWT` function provides an option to extract the roles so they can be assigned to the `currentUser`.

For example:

```js
// api/src/lib/auth.js`
export const getCurrentUser = async (decoded) => {
  return context.currentUser || { ...decoded, roles: parseJWT({ decoded }).roles }
}
```

Now your `currentUser.roles` info will be available to both `requireAuth()` on the api side and `hasRole()` on the web side.

+++

### Role Protection on Web

You can protect content by role in pages or components via the `useAuth()` hook:

```js
const { isAuthenticated, hasRole } = useAuth()

...

{hasRole('admin') && (
  <Link to={routes.admin()}>Admin</Link>
)}

{hasRole(['author', 'editor']) && (
  <Link to={routes.posts()}>Admin</Link>
)}
```

### Routes

Routes can require authentication by wrapping them in a `<Private>` component. An unauthenticated user will be redirected to the page specified in `unauthenticated`.

```js
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

```js
import { Router, Route, Private } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={HomePage} name="home" />
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/forbidden" page={ForbiddenPage} name="login" />

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

## Contributing

If you are interested in contributing to the Redwood Auth Package, please [start here](https://github.com/redwoodjs/redwood/blob/main/packages/auth/README.md).
