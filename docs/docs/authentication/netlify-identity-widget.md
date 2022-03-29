### Netlify Identity Widget

+++ View Installation and Setup

#### Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```terminal
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

```js
// web/src/App.js
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
