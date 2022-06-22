---
sidebar_label: Clerk
---

# Clerk Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth clerk
```

## Setup

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

## Login and Logout Options

When using the Clerk client, `login` and `signUp` take an `options` object that can be used to override the client config.

For `login` the `options` may contain all the options listed at the Clerk [props documentation for login](https://docs.clerk.dev/reference/clerkjs/clerk#signinprops).

For `signUp` the `options` may contain all the options listed at the Clerk [props documentation for signup](https://docs.clerk.dev/reference/clerkjs/clerk#signupprops).

## Avoiding Feature Duplication Confusion

Redwood's integration of Clerk is based on [Clerk's React SDK](https://docs.clerk.dev/reference/clerk-react). This means there is some duplication between the features available through that SDK and the ones available in the `@redwoodjs/auth` package - such as the alternatives of using Clerk's `SignedOut` component to redirect users away from a private page vs. using Redwood's `Private` route wrapper. In general, we would recommend you use the **Redwood** way of doing things when possible, as that is more likely to function harmoniously with the rest of Redwood. That being said, though, there are some great features in Clerk's SDK that you will be able to now use in your app, such as the `UserButton` and `UserProfile` components.
