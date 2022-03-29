### Magic.Link

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```terminal
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

```js
// web/src/App.js|tsx
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

```js
// web/src/Routes.js|tsx
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
