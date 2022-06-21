---
sidebar_label: GoTrue
---

# GoTrue Authentication

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth goTrue
```

_If you prefer to manually install the package and add code_, run the following command and then add the required code provided in the next section.

```bash
cd web
yarn add @redwoodjs/auth gotrue-js
```

## Setup

You will need to enable Identity on your Netlify site.

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
