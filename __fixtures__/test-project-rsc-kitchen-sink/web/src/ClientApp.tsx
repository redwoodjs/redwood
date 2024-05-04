import { VirtualClientRouter } from '@redwoodjs/router/dist/client-router'
// @ts-expect-error - something with the types for our vite package is off
import { renderFromRscServer } from '@redwoodjs/vite/client'
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'

import './index.css'
import './scaffold.css'

// const NavigationLayout = renderFromRscServer('NavigationLayout')
const NavigationLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <h1>ClientApp NavigationLayout</h1>
      {children}
    </>
  )
}

const wrappers = {
  NavigationLayout,
}

const serializedRoutes = {
  pathRouteMap: {
    '/': {
      redirect: null,
      name: 'home',
      path: '/',
      whileLoadingPage: undefined,
      page: 'HomePage',
      sets: [
        {
          id: '1',
          wrappers: ['NavigationLayout'],
          isPrivate: false,
          props: {},
        },
      ],
    },
    '/about': {
      redirect: null,
      name: 'about',
      path: '/about',
      whileLoadingPage: undefined,
      page: 'AboutPage',
      sets: [
        {
          id: '1',
          wrappers: ['NavigationLayout'],
          isPrivate: false,
          props: {},
        },
      ],
    },
  },
  hasHomeRoute: true,
  NotFoundPage: 'NotFoundPage',
  activeRoutePath: '/',
}

const analyzedRoutes = {
  pathRouteMap: Object.fromEntries(
    Object.entries(serializedRoutes.pathRouteMap).map(([path, route]) => [
      path,
      {
        ...route,
        page: renderFromRscServer(route.page),

        sets: route.sets.map((set) => {
          return {
            ...set,
            // wrappers: set.wrappers.map((w) => renderFromRscServer(w)),
            wrappers: set.wrappers.map((w) => wrappers[w]),
          }
        }),
      },
    ])
  ),
  hasHomeRoute: serializedRoutes.hasHomeRoute,
  NotFoundPage: serializedRoutes.NotFoundPage
    ? renderFromRscServer(serializedRoutes.NotFoundPage)
    : null,
  activeRoutePath: serializedRoutes.activeRoutePath,
}

const App = () => {
  console.log('ClientApp')

  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider>
          <VirtualClientRouter analyzedRoutes={analyzedRoutes} />
        </RedwoodApolloProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
