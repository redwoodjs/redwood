export const webAppTsx =
  "import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'\n" +
  `import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <RedwoodApolloProvider>
        <Routes />
      </RedwoodApolloProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
`

export const graphqlTs =
  "import { createGraphQLHandler } from '@redwoodjs/graphql-server'\n" +
  `
import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = createGraphQLHandler({
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
`

export const dbAuthWebAuthTsTemplate =
  "import { createAuth } from '@redwoodjs/auth-dbauth-web'\n\n" +
  'export const { AuthProvider, useAuth } = createAuth()\n'

export const routesTsx =
  "// In this file, all Page components from 'src/pages` are auto-imported. Nested\n" +
  `// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`

export const legacyAuthWebAppTsx =
  "import netlifyIdentity from 'netlify-identity-widget'\n" +
  `
import { AuthProvider } from '@redwoodjs/auth'
import { isBrowser } from '@redwoodjs/prerender/browserUtils'
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

isBrowser && netlifyIdentity.init()

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <AuthProvider client={netlifyIdentity} type="netlify">
        <RedwoodApolloProvider>
          <Routes />
        </RedwoodApolloProvider>
      </AuthProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
`

export const customApolloAppTsx =
  "import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'\n" +
  `import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <RedwoodApolloProvider graphQLClientConfig={{ cache }}>
        <Routes />
      </RedwoodApolloProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
`

export const customPropsRoutesTsx =
  "// In this file, all Page components from 'src/pages` are auto-imported. Nested\n" +
  `// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router
      pageLoadingDelay={400}
      trailingSlashes="always"
      paramTypes={{
        foo: {
          match: /foo/,
          parse: (value: string) => value.split('').reverse().join(''),
        },
      }}
    >
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`

export const useAuthRoutesTsx =
  "// In this file, all Page components from 'src/pages` are auto-imported. Nested\n" +
  `// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router
      pageLoadingDelay={400}
      trailingSlashes="always"
      paramTypes={{
        foo: {
          match: /foo/,
          parse: (value: string) => value.split('').reverse().join(''),
        },
      }}
      useAuth={() => ({
        loading: false,
        isAuthenticated: false
      })}
    >
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`

export const explicitReturnAppTsx =
  "import { useEffect } from 'react'\n" +
  `import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const App = (props) => {
  const { cache } = props

  useEffect(() => {
    console.log('Running my custom useEffect hook on each render.')
  })

  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider>
          <AnotherProvider>
            <Routes />
          </AnotherProvider>
        </RedwoodApolloProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
`

export const withoutRedwoodApolloAppTsx =
  "import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'\n" +
  `
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const queryClient = {}

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <QueryClientProvider client={queryClient}>
        <RedwoodReactQueryProvider>
          <Routes />
        </RedwoodReactQueryProvider>
      </QueryClientProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
`

export const withAuthDecoderGraphqlTs =
  "import { authDecoder } from '@redwoodjs/auth-dbauth-api'\n" +
  `import { createGraphQLHandler } from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

import { getCurrentUser } from 'src/lib/auth'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = createGraphQLHandler({
  authDecoder,
  getCurrentUser,
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
`

export const nonStandardAuthDecoderGraphqlTs =
  "import { authDecoder as dbAuthAuthDecoder } from '@redwoodjs/auth-dbauth-api'\n" +
  `import { createGraphQLHandler } from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

import { getCurrentUser } from 'src/lib/auth'
import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = createGraphQLHandler({
  getCurrentUser,
  loggerConfig: { logger, options: {} },
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
  authDecoder: dbAuthAuthDecoder,
})
`
