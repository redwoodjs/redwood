---
sidebar_label: Magic.link
---

# Magic.Link Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth magicLink
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth magic-sdk
```

## Setup

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

## Integration

The Redwood API does not include the functionality to decode Magic.link authentication tokens, so the client is initiated and decodes the tokens inside of `getCurrentUser`.

### Installation

First, you must manually install the **Magic Admin SDK** in your project's `api/package.json`.

```bash
yarn workspace api add @magic-sdk/admin
```

### Setup

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
