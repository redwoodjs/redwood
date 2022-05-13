---
description: Set up an authentication provider
---

# Authentication

`@redwoodjs/auth` contains both a built-in database-backed authentication system (dbAuth), as well as lightweight wrappers around popular SPA authentication libraries.

We currently support the following third-party authentication providers:

- Netlify Identity _([Repo on GitHub](https://github.com/netlify/netlify-identity-widget))_
- Netlify GoTrue-JS _([Repo on GitHub](https://github.com/netlify/gotrue-js))_
- Auth0 _([Repo on GitHub](https://github.com/auth0/auth0-spa-js))_
- Clerk _([Website](https://clerk.dev))_
- Azure Active Directory _([Repo on GitHub](https://github.com/AzureAD/microsoft-authentication-library-for-js))_
- Magic Links - Magic.js _([Repo on GitHub](https://github.com/MagicHQ/magic-js))_
- Firebase _([Documentation Website](https://firebase.google.com/docs/auth))_
- Supabase _([Documentation Website](https://supabase.io/docs/guides/auth))_
- Ethereum _([Repo on GitHub](https://github.com/oneclickdapp/ethereum-auth))_
- Nhost _([Documentation Website](https://docs.nhost.io/platform/authentication))_
- Custom
- [Contribute one](https://github.com/redwoodjs/redwood/tree/main/packages/auth), it's SuperEasy™!

> 👉 Check out the [Auth Playground](https://github.com/redwoodjs/playground-auth).

## Self-hosted Auth Installation and Setup

Redwood's own **dbAuth** provides several benefits:

- Use your own database for storing user credentials
- Use your own login, signup and forgot password pages (or use Redwood's pre-built ones)
- Customize login session length
- No external dependencies
- No user data ever leaves your servers
- No additional charges/limits based on number of users
- No third party service outages affecting your site

And potentially one large drawback:

- Use your own database for storing user credentials

However, we're following best practices for storing these credentials:

1. Users' passwords are [salted and hashed](https://auth0.com/blog/adding-salt-to-hashing-a-better-way-to-store-passwords/) with PBKDF2 before being stored
2. Plaintext passwords are never stored anywhere, and only transferred between client and server during the login/signup phase (and hopefully only over HTTPS)
3. Our logger scrubs sensitive parameters (like `password`) before they are output

Even if you later decide you want to let someone else handle your user data for you, dbAuth is a great option for getting up and running quickly (we even have a generator for creating basic login and signup pages for you).

### How It Works

dbAuth relies on good ol' fashioned cookies to determine whether a user is logged in or not. On an attempted login, a serverless function on the api-side checks whether a user exists with the given username (internally, dbAuth refers to this field as _username_ but you can use anything you want, like an email address). If a user with that username is found, does their salted and hashed password match the one in the database?

If so, an [HttpOnly](https://owasp.org/www-community/HttpOnly), [Secure](https://owasp.org/www-community/controls/SecureCookieAttribute), [SameSite](https://owasp.org/www-community/SameSite) cookie (dbAuth calls this the "session cookie") is sent back to the browser containing the ID of the user. The content of the cookie is a simple string, but AES encrypted with a secret key (more on that later).

When the user makes a GraphQL call, we decrypt the cookie and make sure that the user ID contained within still exists in the database. If so, the request is allowed to proceed.

If there are any shenanigans detected (the cookie can't be decrypted properly, or the user ID found in the cookie does not exist in the database) the user is immediately logged out by expiring the session cookie.

### Setup

A single CLI command will get you everything you need to get dbAuth working, minus the actual login/signup pages:

    yarn rw setup auth dbAuth

Read the post-install instructions carefully as they contain instructions for adding database fields for the hashed password and salt, as well as how to configure the auth serverless function based on the name of the table that stores your user data. Here they are, but could change in future releases:

> You will need to add a couple of fields to your User table in order to store a hashed password and salt:
>
>     model User {
>       id             Int @id @default(autoincrement())
>       email          String  @unique
>       hashedPassword      String    // <─┐
>       salt                String    // <─┼─ add these lines
>       resetToken          String?   // <─┤
>       resetTokenExpiresAt DateTime? // <─┘
>     }
>
> If you already have existing user records you will need to provide a default value or Prisma complains, so change those to:
>
>     hashedPassword String @default("")
>     salt           String @default("")
>
> You'll need to let Redwood know what field you're using for your users' `id` and `username` fields In this case we're using `id` and `email`, so update those in the `authFields` config in `/api/src/functions/auth.js` (this is also the place to tell Redwood if you used a different name for the `hashedPassword` or `salt` fields):
>
>     authFields: {
>       id: 'id',
>       username: 'email',
>       hashedPassword: 'hashedPassword',
>       salt: 'salt',
>       resetToken: 'resetToken',
>       resetTokenExpiresAt: 'resetTokenExpiresAt',
>     },
>
> To get the actual user that's logged in, take a look at `getCurrentUser()` in `/api/src/lib/auth.js`. We default it to something simple, but you may use different names for your model or unique ID fields, in which case you need to update those calls (instructions are in the comment above the code).
>
> Finally, we created a `SESSION_SECRET` environment variable for you in `.env`. This value should NOT be checked into version control and should be unique for each environment you deploy to. If you ever need to log everyone out of your app at once change this secret to a new value. To create a new secret, run:
>
>     yarn rw g secret
>
> Need simple Login, Signup and Forgot Password pages? Of course we have a generator for those:
>
> yarn rw generate dbAuth

Note that if you change the fields named `hashedPassword` and `salt`, and you have some verbose logging in your app, you'll want to scrub those fields from appearing in your logs. See the [Redaction](logger.md#redaction) docs for info.

### Scaffolding Login/Signup/Forgot Password Pages

If you don't want to create your own login, signup and forgot password pages from scratch we've got a generator for that:

    yarn rw g dbAuth

The default routes will make them available at `/login`, `/signup`, `/forgot-password`, and `/reset-password` but that's easy enough to change. Again, check the post-install instructions for one change you need to make to those pages: where to redirect the user to once their login/signup is successful.

If you'd rather create your own, you might want to start from the generated pages anyway as they'll contain the other code you need to actually submit the login credentials or signup fields to the server for processing.

### Configuration

Almost all config for dbAuth lives in `api/src/functions/auth.js` in the object you give to the `DbAuthHandler` initialization. The comments above each key will explain what goes where. Here's an overview of the more important options:

#### login.handler()

If you want to do something other than immediately let a user log in if their username/password is correct, you can add additional logic in `login.handler()`. For example, if a user's credentials are correct, but they haven't verified their email address yet, you can throw an error in this function with the appropriate message and then display it to the user. If the login should proceed, simply return the user that was passed as the only argument to the function:

```jsx
login: {
  handler: (user) => {
    if (!user.verified) {
      throw new Error('Please validate your email first!')
    } else {
      return user
    }
  }
}
```

#### signup.handler()

This function should contain the code needed to actually create a user in your database. You will receive a single argument which is an object with all of the fields necessary to create the user (`username`, `hashedPassword` and `salt`) as well as any additional fields you included in your signup form in an object called `userAttributes`:

```jsx
signup: {
  handler: ({ username, hashedPassword, salt, userAttributes }) => {
    return db.user.create({
      data: {
        email: username,
        hashedPassword: hashedPassword,
        salt: salt,
        name: userAttributes.name,
      },
    })
  }
}
```

Before `signup.handler()` is invoked, dbAuth will check that the username is unique in the database and throw an error if not.

There are three things you can do within this function depending on how you want the signup to proceed:

1. If everything is good and the user should be logged in after signup: return the user you just created
2. If the user is safe to create, but you do not want to log them in automatically: return a string, which will be returned by the `signUp()` function you called after destructuring it from `useAuth()` (see code snippet below)
3. If the user should _not_ be able to sign up for whatever reason: throw an error in this function with the message to be displayed

You can deal with case #2 by doing something like the following in a signup component/page:

```jsx
const { signUp } = useAuth()

const onSubmit = async (data) => {
  const response = await signUp({ ...data })

  if (response.message) {
    toast.error(response.message) // user created, but not logged in
  } else {
    toast.success('Welcome!') // user created and logged in
    navigate(routes.dashboard())
  }
}
```

#### forgotPassword.handler()

This handler is invoked if a user is found with the username/email that they submitted on the Forgot Password page, and that user will be passed as an argument. Inside this function is where you'll send the user a link to reset their password—via an email is most common. The link will, by default, look like:

    https://example.com/reset-password?resetToken=${user.resetToken}

If you changed the path to the Reset Password page in your routes you'll need to change it here. If you used another name for the `resetToken` database field, you'll need to change that here as well:

    https://example.com/reset-password?resetKey=${user.resetKey}

#### resetPassword.handler()

This handler is invoked after the password has been successfully changed in the database. Returning something truthy (like `return user`) will automatically log the user in after their password is changed. If you'd like to return them to the login page and make them log in manually, `return false` and redirect the user in the Reset Password page.

#### Cookie config

These options determine how the cookie that tracks whether the client is authorized is stored in the browser. The default configuration should work for most use cases. If you serve your web and api sides from different domains you'll need to make some changes: set `SameSite` to `None` and then add [CORS configuration](#cors-config).

```jsx
cookie: {
  HttpOnly: true,
  Path: '/',
  SameSite: 'Strict',
  Secure: true,
  // Domain: 'example.com',
}
```

#### CORS config

If you're using dbAuth and your api and web sides are deployed to different domains then you'll need to configure CORS for both GraphQL in general and dbAuth. You'll also need to enable a couple of options to be sure and send/accept credentials in XHR requests. For more info, see the complete [CORS doc](cors.md#cors-and-authentication).

#### Error Messages

There are several error messages that can be displayed, including:

- Username/email not found
- Incorrect password
- Expired reset password token

We've got some default error messages that sound nice, but may not fit the tone of your site. You can customize these error messages in `api/src/functions/auth.js` in the `errors` prop of each of the `login`, `signup`, `forgotPassword` and `resetPassword` config objects. The generated file contains tons of comments explaining when each particular error message may be shown.

### Environment Variables

#### Cookie Domain

By default, the session cookie will not have the `Domain` property set, which a browser will default to be the [current domain only](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent). If your site is spread across multiple domains (for example, your site is at `example.com` but your api-side is deployed to `api.example.com`) you'll need to explicitly set a Domain so that the cookie is accessible to both.

To do this, create an environment variable named `DBAUTH_COOKIE_DOMAIN` set to the root domain of your site, which will allow it to be read by all subdomains as well. For example:

    DBAUTH_COOKIE_DOMAIN=example.com

#### Session Secret Key

If you need to change the secret key that's used to encrypt the session cookie, or deploy to a new target (each deploy environment should have its own unique secret key) we've got a CLI tool for creating a new one:

    yarn rw g secret

Note that the secret that's output is _not_ appended to your `.env` file or anything else, it's merely output to the screen. You'll need to put it in the right place after that.

> The `.env` file is set to be ignored by git and not committed to version control. There is another file, `.env.defaults`, which is meant to be safe to commit and contain simple ENV vars that your dev team can share. The encryption key for the session cookie is NOT one of these shareable vars!

## Third Party Providers Installation and Setup

You will need to instantiate your authentication client and pass it to the `<AuthProvider>`. See instructions below for your specific provider.

### Netlify Identity Widget

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth netlify
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth netlify-identity-widget
```

#### Setup

You will need to enable Identity on your Netlify site.
<!-- See [Netlify Identity Setup](tutorial/chapter4/authentication.md#netlify-identity-setup). -->

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
import netlifyIdentity from 'netlify-identity-widget'
import { isBrowser } from '@redwoodjs/prerender/browserUtils'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

isBrowser && netlifyIdentity.init()

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={netlifyIdentity} type="netlify">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

#### Netlify Identity Auth Provider Specific Setup

See the Netlify Identity information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.

+++

### GoTrue-JS

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth goTrue
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth gotrue-js
```

#### Setup

You will need to enable Identity on your Netlify site.
<!-- See [Netlify Identity Setup](tutorial/chapter4/authentication.md#netlify-identity-setup). -->

Add the GoTrue-JS package to the web side:

```bash
yarn workspace web add gotrue-js
```

Instantiate GoTrue and pass in your configuration. Be sure to set APIUrl to the API endpoint found in your Netlify site's Identity tab:

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
import GoTrue from 'gotrue-js'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const goTrueClient = new GoTrue({
  APIUrl: 'https://MYAPP.netlify.app/.netlify/identity',
  setCookie: true,
})

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={goTrueClient} type="goTrue">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

+++

### Auth0

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
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

#### Login and Logout Options

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

#### Auth0 Auth Provider Specific Setup

See the Auth0 information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.

+++

### Clerk

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth clerk
```

#### Setup

To get started with Clerk, sign up on [their website](https://clerk.dev/) and create an application, or follow their [RedwoodJS Blog Tutorial with Clerk](https://clerk.dev/tutorials/redwoodjs-blog-tutorial-with-clerk) that has an [example repo](https://github.com/redwoodjs/redwood-tutorial) already setup.

It's important that the `ClerkAuthProvider` added to your `App.{js|ts}` file during setup is within the `RedwoodProvider` and around Redwood's `AuthProvider`:

```tsx {4,10} title="web/src/App.{js|ts}"
const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <ClerkAuthProvider>
        <AuthProvider type="clerk">
          <RedwoodApolloProvider>
            <Routes />
          </RedwoodApolloProvider>
        </AuthProvider>
      </ClerkAuthProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)
```

The [RedwoodJS Blog Tutorial with Clerk](https://clerk.dev/tutorials/redwoodjs-blog-tutorial-with-clerk) also explains how to use `@clerk/clerk-react` components with Redwood's `useAuth()` hook:

```tsx
import { UserButton, SignInButton } from '@clerk/clerk-react'

// ...

{
  isAuthenticated ? (
    <UserButton afterSignOutAll={window.location.href} />
  ) : (
    <SignInButton mode="modal">
      <button>Log in</button>
    </SignInButton>
  )
}
```

Applications in Clerk have different instances. By default, there's one for development, one for staging, and one for production. You'll need to pull three values from one of these instances. We recommend storing the development values in your local `.env` file and using the staging and production values in the appropriate env setups for your hosting platform when you deploy.

The three values you'll need from Clerk are your instance's "Frontend API Key" url, a "Backend API key" and a "JWT verification key", all from your instance's settings under "API Keys". The Frontend API url should be stored in an env variable named `CLERK_FRONTEND_API_URL`. The Backend API key should be named `CLERK_API_KEY`. Finally, the JWT key should be named `CLERK_JWT_KEY`

Otherwise, feel free to configure your instances however you wish with regards to their appearance and functionality.

> **Including Environment Variables in Serverless Deploys**
>
> In addition to adding these env vars to your local `.env` file or deployment hosting provider, you _must_ take an additional step to include them in your deployment build process. Using the names exactly as given above, follow the instructions in [this document](environment-variables.md). You need to expose the `CLERK_FRONTEND_API_URL` variable to the `web` side.

#### Login and Logout Options

When using the Clerk client, `login` and `signUp` take an `options` object that can be used to override the client config.

For `login` the `options` may contain all the options listed at the Clerk [props documentation for login](https://docs.clerk.dev/reference/clerkjs/clerk#signinprops).

For `signUp` the `options` may contain all the options listed at the Clerk [props documentation for signup](https://docs.clerk.dev/reference/clerkjs/clerk#signupprops).

#### Avoiding Feature Duplication Confusion

Redwood's integration of Clerk is based on [Clerk's React SDK](https://docs.clerk.dev/reference/clerk-react). This means there is some duplication between the features available through that SDK and the ones available in the `@redwoodjs/auth` package - such as the alternatives of using Clerk's `SignedOut` component to redirect users away from a private page vs. using Redwood's `Private` route wrapper. In general, we would recommend you use the **Redwood** way of doing things when possible, as that is more likely to function harmoniously with the rest of Redwood. That being said, though, there are some great features in Clerk's SDK that you will be able to now use in your app, such as the `UserButton` and `UserProfile` components.

+++

### Azure Active Directory

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth azureActiveDirectory
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @azure/msal-browser
```

#### Setup

To get your application credentials, create an [App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration) using in your Azure Active Directory tenant and make sure you configure as a [MSAL.js 2.0 with auth code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration#redirect-uri-msaljs-20-with-auth-code-flow) registration. Take a note of your generated _Application ID_ (client), and the _Directory ID_ (tenant).

[Learn more about authorization code flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-third-party-cookies-spas).

##### Redirect URIs

Enter allowed redirect urls for the integrations, e.g. `http://localhost:8910/login`. This will be the `AZURE_ACTIVE_DIRECTORY_REDIRECT_URI` environment variable, and suggestively `AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI`.

#### Authority

The Authority is a URL that indicates a directory that MSAL can request tokens from which you can read about [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration#authority). However, you most likely want to have e.g. `https://login.microsoftonline.com/<tenant>` as Authority URL, where `<tenant>` is the Azure Active Directory tenant id. This will be the `AZURE_ACTIVE_DIRECTORY_AUTHORITY` environment variable.

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
import { PublicClientApplication } from '@azure/msal-browser'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const azureActiveDirectoryClient = new PublicClientApplication({
  auth: {
    clientId: process.env.AZURE_ACTIVE_DIRECTORY_CLIENT_ID,
    authority: process.env.AZURE_ACTIVE_DIRECTORY_AUTHORITY,
    redirectUri: process.env.AZURE_ACTIVE_DIRECTORY_REDIRECT_URI,
    postLogoutRedirectUri: process.env.AZURE_ACTIVE_DIRECTORY_LOGOUT_REDIRECT_URI,
  },
})

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={azureActiveDirectoryClient} type="azureActiveDirectory">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

#### Roles

To setup your App Registration with custom roles and have them exposed via the `roles` claim, follow [this documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-add-app-roles-in-azure-ad-apps).

#### Login Options

Options in method `logIn(options?)` is of type [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest) and is a good place to pass in optional [scopes](https://docs.microsoft.com/en-us/graph/permissions-reference#user-permissions) to be authorized. By default, MSAL sets `scopes` to [/.default](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#the-default-scope) which is built in for every application that refers to the static list of permissions configured on the application registration. Furthermore, MSAL will add `openid` and `profile` to all requests. In example below we explicit include `User.Read.All` to the login scope.

```jsx
await logIn({
  scopes: ['User.Read.All'], // becomes ['openid', 'profile', 'User.Read.All']
})
```

See [loginRedirect](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html#loginredirect), [PublicClientApplication](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html) class and [Scopes Behavior](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/docs/scopes.md#scopes-behavior) for more documentation.

#### getToken Options

Options in method `getToken(options?)` is of type [RedirectRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#redirectrequest). By default, `getToken` will be called with scope `['openid', 'profile']`. As Azure Active Directory apply [incremental consent](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md#dynamic-scopes-and-incremental-consent), we can extend the permissions from the login example by including another scope, for example `Mail.Read`.

```jsx
await getToken({
  scopes: ['Mail.Read'], // becomes ['openid', 'profile', 'User.Read.All', 'Mail.Read']
})
```

See [acquireTokenSilent](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html#acquiretokensilent), [Resources and Scopes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md#resources-and-scopes) or [full class documentation](https://pub.dev/documentation/msal_js/latest/msal_js/PublicClientApplication-class.html#constructors) for more documentation.

+++

### Magic.Link

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth magicLink
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth magic-sdk
```

#### Setup

To get your application keys, go to [dashboard.magic.link](https://dashboard.magic.link/) then navigate to the API keys add them to your `.env`.

> **Including Environment Variables in Serverless Deployment:** in addition to adding the following env vars to your deployment hosting provider, you _must_ take an additional step to include them in your deployment build process. Using the names exactly as given below, follow the instructions in [this document](environment-variables.md) to "Whitelist them in your `redwood.toml`".

```jsx title="web/src/App.js|tsx"
import { useAuth, AuthProvider } from '@redwoodjs/auth'
import { Magic } from 'magic-sdk'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const m = new Magic(process.env.MAGICLINK_PUBLIC)

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={m} type="magicLink">
      <RedwoodApolloProvider useAuth={useAuth}>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

```jsx title="web/src/Routes.js|tsx"
import { useAuth } from '@redwoodjs/auth'
import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Route path="/" page={HomePage} name="home" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

#### Magic.Link Auth Provider Specific Integration

See the Magic.Link information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.
+++

### Firebase

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth firebase
```

#### Setup

We're using [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin), so you'll have to follow the ["Before you begin"](https://firebase.google.com/docs/auth/web/google-signin#before_you_begin) steps in this guide. **Only** follow the "Before you begin" parts.

> **Including Environment Variables in Serverless Deployment:** in addition to adding the following env vars to your deployment hosting provider, you _must_ take an additional step to include them in your deployment build process. Using the names exactly as given below, follow the instructions in [this document](https://redwoodjs.com/docs/environment-variables) to "Whitelist them in your `redwood.toml`".

```jsx title="web/src/App.js"
import { AuthProvider } from '@redwoodjs/auth'
import { initializeApp, getApps, getApp } from '@firebase/app'
import * as firebaseAuth from '@firebase/auth'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const firebaseClientConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const firebaseApp = ((config) => {
  const apps = getApps()
  if (!apps.length) {
    initializeApp(config)
  }
  return getApp()
})(firebaseConfig)

export const firebaseClient = {
  firebaseAuth,
  firebaseApp,
}

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={firebaseClient} type="firebase">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
```

#### Usage

```jsx
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

#### Firebase Auth Provider Specific Integration

See the Firebase information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.
+++

### Supabase

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth supabase
```

#### Setup

Update your .env file with the following settings supplied when you created your new Supabase project:

- `SUPABASE_URL` with the unique Supabase URL for your project
- `SUPABASE_KEY` with the unique Supabase Key that identifies which API KEY to use
- `SUPABASE_JWT_SECRET` with the secret used to sign and verify the JSON Web Token (JWT)

You can find these values in your project's dashboard under Settings -> API.

For full Supabase documentation, see: <https://supabase.io/docs>

#### Usage

Supabase supports several sign in methods:

- email/password
- passwordless via emailed magiclink
- authenticate via phone with SMS based OTP (One-Time Password) tokens. See: [SMS OTP with Twilio](https://supabase.io/docs/guides/auth/auth-twilio)
- Sign in with redirect. You can control where the user is redirected to after they are logged in via a `redirectTo` option.
- Sign in with a valid refresh token that was returned on login.
- Sign in using third-party providers/OAuth via
  - [Apple](https://supabase.io/docs/guides/auth/auth-apple)
  - Azure Active Directory
  - [Bitbucket](https://supabase.io/docs/guides/auth/auth-bitbucket)
  - [Discord](https://supabase.io/docs/guides/auth/auth-discord)
  - [Facebook](https://supabase.io/docs/guides/auth/auth-facebook)
  - [GitHub](https://supabase.io/docs/guides/auth/auth-github)
  - [GitLab](https://supabase.io/docs/guides/auth/auth-gitlab)
  - [Google](https://supabase.io/docs/guides/auth/auth-google)
  - [Twitch](https://supabase.io/docs/guides/auth/auth-twitch)
  - [Twitter](https://supabase.io/docs/guides/auth/auth-twitter)
- Sign in with a [valid refresh token](https://supabase.io/docs/reference/javascript/auth-signin#sign-in-using-a-refresh-token-eg-in-react-native) that was returned on login. Used e.g. in React Native.
- Sign in with scopes. If you need additional data from an OAuth provider, you can include a space-separated list of `scopes` in your request options to get back an OAuth `provider_token`.

Depending on the credentials provided:

- A user can sign up either via email or sign in with supported OAuth provider: `'apple' | 'azure' | 'bitbucket' | 'discord' | 'facebook' | 'github' | 'gitlab' | 'google' | 'twitch' | 'twitter'`
- If you sign in with a valid refreshToken, the current user will be updated
- If you provide email without a password, the user will be sent a magic link.
- The magic link's destination URL is determined by the SITE_URL config variable. To change this, you can go to Authentication -> Settings on `app.supabase.io` for your project.
- Specifying an OAuth provider will open the browser to the relevant login page
- Note: You must enable and configure the OAuth provider appropriately. To configure these providers, you can go to Authentication -> Settings on `app.supabase.io` for your project.
- Note: To authenticate using SMS based OTP (One-Time Password) you will need a [Twilio](https://www.twilio.com/try-twilio) account

For Supabase Authentication documentation, see: <https://supabase.io/docs/guides/auth>

+++

### Ethereum

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth ethereum
```

#### Setup

To complete setup, you'll also need to update your `api` server manually. See https://github.com/oneclickdapp/ethereum-auth for instructions.

+++

### Nhost

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth nhost
```

#### Setup

Update your .env file with the following setting which can be found on your Nhost project's dashboard.

- `NHOST_BACKEND_URL` with the unique Nhost Backend URL that can be found in the app's dashboard.
- `NHOST_JWT_SECRET` with the JWT Key secret that you have set in your project's Settings > Hasura "JWT Key" section.

#### Usage

Nhost supports the following methods:

- email/password
- passwordless with email
- passwordless with SMS
- OAuth Providers (via GitHub, Google, Facebook, Spotify, Discord, Twitch, Apple, Twitter, Microsoft and Linkedin).

Depending on the credentials provided:

- A user can sign in either via email or a supported OAuth provider.
- A user can sign up via email and password. For OAuth simply sign in and the user account will be created if it does not exist.
- Note: You must enable and configure the OAuth provider appropriately. To enable and configure a provider, please navigate to Users -> Login settings, from your app's dashboard.

For the docs on Authentication, see: <https://docs.nhost.io/platform/authentication>

If you are also **using Nhost as your GraphQL API server**, you will need to pass `skipFetchCurrentUser` as a prop to `AuthProvider` , as follows:

```jsx
<AuthProvider client={nhost} type="nhost" skipFetchCurrentUser>
```

This avoids having an additional request to fetch the current user which is meant to work with Apollo Server and Prisma.

Important: The `skipFetchCurrentUser` attribute is **only** needed if you are **not** using the standard RedwoodJS api side GraphQL Server.
+++

### Custom

+++ View Installation and Setup

#### Installation

The following CLI command (not implemented, see https://github.com/redwoodjs/redwood/issues/1585) will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth custom
```

#### Setup

It is possible to implement a custom provider for Redwood Auth. In which case you might also consider adding the provider to Redwood itself.

If you are trying to implement your own auth, support is very early and limited at this time. Additionally, there are many considerations and responsibilities when it comes to managing custom auth. For most cases we recommend using an existing provider.

However, there are examples contributed by developers in the Redwood forums and Discord server.

The most complete example (although now a bit outdated) is found in [this forum thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610). Here's another [helpful message in the thread](https://community.redwoodjs.com/t/custom-github-jwt-auth-with-redwood-auth/610/25).
+++

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

The value returned by `getCurrentUser` is available in `context.currentUser`

Use `requireAuth` in your services to check that a user is logged in,
whether or not they are assigned a role, and optionally raise an
error if they're not.

```jsx
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

#### Add App Metadata to JWT Rule in Auth0

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

#### Add Application hasRole Support in Auth0

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

+++

#### Magic.Link

The Redwood API does not include the functionality to decode Magic.link authentication tokens, so the client is initiated and decodes the tokens inside of `getCurrentUser`.

+++ View Magic.link Options

##### Installation

First, you must manually install the **Magic Admin SDK** in your project's `api/package.json`.

```bash
yarn workspace api add @magic-sdk/admin
```

##### Setup

To get your application running _without setting up_ `Prisma`, get your `SECRET KEY` from [dashboard.magic.link](https://dashboard.magic.link/). Then add `MAGICLINK_SECRET` to your `.env`.

```jsx title="redwood/api/src/lib/auth.js|ts"
import { Magic } from '@magic-sdk/admin'

export const getCurrentUser = async (_decoded, { token }) => {
  const mAdmin = new Magic(process.env.MAGICLINK_SECRET)

  return await mAdmin.users.getMetadataByToken(token)
}
```

Magic.link recommends using the issuer as the userID to retrieve user metadata via `Prisma`

```jsx title="redwood/api/src/lib/auth.ts"
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

```jsx
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

```jsx
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

```jsx title="api/src/lib/auth.js"
export const getCurrentUser = async (decoded) => {
  return context.currentUser || { ...decoded, roles: parseJWT({ decoded }).roles }
}
```

Now your `currentUser.roles` info will be available to both `requireAuth()` on the api side and `hasRole()` on the web side.

+++

### Role Protection on Web

You can protect content by role in pages or components via the `useAuth()` hook:

```jsx
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
