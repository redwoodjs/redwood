---
sidebar_label: Firebase
---

# Firebase Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth firebase
```

## Setup

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

## Usage

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

## Integration

See the Firebase information within this doc's [Auth Provider Specific Integration](#auth-provider-specific-integration) section.

You must follow the ["Before you begin"](https://firebase.google.com/docs/auth/web/google-signin) part of the "Authenticate Using Google Sign-In with JavaScript" guide.

### Role-Based Access Control (RBAC)

Requires a custom implementation.

### App Metadata

None.

### Add Application `hasRole` Support

Requires a custom implementation.

### Auth Providers

Providers can be configured by specifying `logIn(provider)` and `signUp(provider)`, where `provider` is a **string** of one of the supported providers.

Supported providers:

- google.com (Default)
- facebook.com
- github.com
- twitter.com
- microsoft.com
- apple.com

### Email & Password Auth

Email/password authentication is supported by calling `login({ email, password })` and `signUp({ email, password })`.

### Email Link (Password-less Sign-in)

In Firebase Console, you must enable "Email link (passwordless sign-in)" with the configuration toggle for the email provider. The authentication sequence for passwordless email links has two steps:

1. First, an email with the link must be generated and sent to the user. Either using using firebase client sdk (web side) [sendSignInLinkToEmail()](https://firebase.google.com/docs/reference/js/auth.emailauthprovider#example_2_2), which generates the link and sends the email to the user on behalf of your application or alternatively, generate the link using backend admin sdk (api side), see ["Generate email link for sign-in](https://firebase.google.com/docs/auth/admin/email-action-links#generate_email_link_for_sign-in) but it is then your responsibility to send an email to the user containing the link.
2. Second, authentication is completed when the user is redirected back to the application and the AuthProvider's logIn(\{emailLink, email, providerId: 'emailLink'\}) method is called.

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

### Custom Token

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

### Custom Parameters & Scopes for Google OAuth Provider

Both `logIn()` and `signUp()` can accept a single argument of either a **string** or **object**. If a string is provided, it should be any of the supported providers (see above), which will configure the defaults for that provider.

`logIn()` and `signUp()` also accept a single a configuration object. This object accepts `providerId`, `email`, `password`, and `scope` and `customParameters`. (In fact, passing in any arguments ultimately results in this object). You can use this configuration object to pass in values for the optional Google OAuth Provider methods _setCustomParameters_ and _addScope_.

Below are the parameters that `logIn()` and `signUp()` accept:

- `providerId`: Accepts one of the supported auth providers as a **string**. If no arguments are passed to `login() / signUp()` this will default to 'google.com'. Provider strings passed as a single argument to `login() / signUp()` will be cast to this value in the object.
- `email`: Accepts a **string** of a users email address. Used in conjunction with `password` and requires that Firebase has email authentication enabled as an option.
- `password`: Accepts a **string** of a users password. Used in conjunction with `email` and requires that Firebase has email authentication enabled as an option.
- `scope`: Accepts an **array** of strings ([Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)), which can be added to the requested Google OAuth Provider. These will be added using the Google OAuth _addScope_ method.
- `customParameters`: accepts an **object** with the [optional parameters](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters) for the Google OAuth Provider _setCustomParameters_ method. [Valid parameters](https://developers.google.com/identity/protocols/oauth2/openid-connect#authenticationuriparameters) include 'hd', 'include_granted_scopes', 'login_hint' and 'prompt'.

### Firebase Auth Examples

- `logIn()/signUp()`: Defaults to Google provider.
- `logIn({providerId: 'github.com'})`: Log in using GitHub as auth provider.
- `signUp({email: "someone@email.com", password: 'some_good_password'})`: Creates a firebase user with email/password.
- `logIn({email: "someone@email.com", password: 'some_good_password'})`: Logs in existing firebase user with email/password.
- `logIn({scopes: ['https://www.googleapis.com/auth/calendar']})`: Adds a scope using the [addScope](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#addscope) method.
- `logIn({ customParameters: { prompt: "consent" } })`: Sets the OAuth custom parameters using [setCustomParameters](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#addscope) method.
