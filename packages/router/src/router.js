// The guts of the router implementation.
import PropTypes from 'prop-types'

import { useAuth as useAuthHook } from '@redwoodjs/auth'

import {
  Location,
  parseSearch,
  replaceParams,
  matchPath,
  ParamsContext,
  navigate,
  mapNamedRoutes,
  PageLoader,
  Redirect,
} from './internal'
import { SplashPage } from './splash-page'

const Route = () => {
  return null
}

/**
 * `Routes` nested in `Private` require authentication.
 * When a user is not authenticated and attempts to visit this route they will be
 * redirected to `unauthenticated` route.
 */
const Private = () => {
  return null
}
Private.propTypes = {
  /**
   * The page name where a user will be redirected when not authenticated.
   */
  unauthenticated: PropTypes.string.isRequired,
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
}

const PrivatePageLoader = ({
  useAuth,
  unauthenticatedRoute,
  role,
  children,
}) => {
  const { loading, isAuthenticated, hasRole } = useAuth()

  if (loading) {
    return null
  }

  if (
    (isAuthenticated && !role) ||
    (isAuthenticated && role && hasRole(role))
  ) {
    return children
  } else {
    return (
      <Redirect
        to={`${unauthenticatedRoute()}?redirectTo=${window.location.pathname}`}
      />
    )
  }
}

const Router = (props) => (
  <Location>
    {(locationContext) => <RouterImpl {...locationContext} {...props} />}
  </Location>
)

/**
 * Pages can be imported automatically or manually. Automatic imports are actually
 * objects and take the following form (which we call a 'spec'):
 *
 *   const WhateverPage = {
 *     name: 'WhateverPage',
 *     loader: () => import('src/pages/WhateverPage')
 *   }
 *
 * Manual imports simply load the page:
 *
 *   import WhateverPage from 'src/pages/WhateverPage'
 *
 * Before passing a "page" to the PageLoader, we will normalize the manually
 * imported version into a spec. */
const normalizePage = (specOrPage) => {
  if (specOrPage.loader) {
    // Already a spec, just return it.
    return specOrPage
  } else {
    // Wrap the Page in a fresh spec, and put it in a promise to emulate
    // an async module import.
    return {
      name: specOrPage.name,
      loader: async () => ({ default: specOrPage }),
    }
  }
}

const DEFAULT_PAGE_LOADING_DELAY = 1000 // milliseconds

const Loaders = ({ allParams, Page, pageLoadingDelay }) => {
  return (
    <PageLoader
      spec={normalizePage(Page)}
      delay={pageLoadingDelay}
      params={allParams}
    />
  )
}

const RouterImpl = ({
  pathname,
  search,
  paramTypes,
  pageLoadingDelay = DEFAULT_PAGE_LOADING_DELAY,
  children,
  useAuth = useAuthHook,
}) => {
  const routes = React.useMemo(() => {
    // Find `Private` components, mark their children `Route` components as private,
    // and merge them into a single array.
    const privateRoutes =
      React.Children.toArray(children)
        .filter((child) => child.type === Private)
        .map((privateElement) => {
          // Set `Route` props
          const { unauthenticated, role, children } = privateElement.props
          return (
            React.Children.toArray(children)
              // Make sure only valid routes are considered
              .filter((route) => route.type === Route)
              .map((route) =>
                React.cloneElement(route, {
                  private: true,
                  unauthenticatedRedirect: unauthenticated,
                  role: role,
                })
              )
          )
        })
        .reduce((a, b) => a.concat(b), []) || []

    const routes = [
      ...privateRoutes,
      ...React.Children.toArray(children).filter(
        (child) => child.type === Route
      ),
    ]

    return routes
  }, [children])

  const namedRoutes = React.useMemo(() => mapNamedRoutes(routes), [routes])

  let NotFoundPage

  for (let route of routes) {
    const { path, page: Page, redirect, notfound } = route.props

    if (notfound) {
      NotFoundPage = Page
      continue
    }

    const { match, params: pathParams } = matchPath(path, pathname, paramTypes)

    if (match) {
      const searchParams = parseSearch(search)
      const allParams = { ...pathParams, ...searchParams }

      if (redirect) {
        const newPath = replaceParams(redirect, pathParams)
        navigate(newPath)
        return (
          <RouterImpl pathname={newPath} search={search}>
            {children}
          </RouterImpl>
        )
      } else {
        if (route?.props?.private) {
          if (typeof useAuth === 'undefined') {
            throw new Error(
              "You're using a private route, but `useAuth` is undefined. Have you created an AuthProvider, or pased in the incorrect prop to `useAuth`?"
            )
          }
          return (
            <PrivatePageLoader
              useAuth={useAuth}
              unauthenticatedRoute={
                namedRoutes[route.props.unauthenticatedRedirect]
              }
              role={route.props.role}
            >
              <Loaders
                allParams={allParams}
                Page={Page}
                pageLoadingDelay={pageLoadingDelay}
              />
            </PrivatePageLoader>
          )
        }

        return (
          <Loaders
            allParams={allParams}
            Page={Page}
            pageLoadingDelay={pageLoadingDelay}
          />
        )
      }
    }
  }

  // If the router is being used in a Redwood app and only the notfound page is
  // specified, show the Redwood splash page.
  if (routes.length === 1 && NotFoundPage) {
    const isRedwood = typeof __REDWOOD__ !== 'undefined'
    return <SplashPage isRedwood={isRedwood} />
  }

  return (
    <ParamsContext.Provider value={{}}>
      <PageLoader spec={normalizePage(NotFoundPage)} />
    </ParamsContext.Provider>
  )
}

export { Router, Route, Private }
