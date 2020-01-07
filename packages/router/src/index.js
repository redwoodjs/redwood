// This is Redwood's routing mechanism. It takes inspiration from both Ruby on
// Rails' routing approach and from both React Router and Reach Router (the
// latter of which has closely inspired some of this code).

import { useContext } from 'react'

import SplashPage from './SplashPage'

// Convert the given path (from the path specified in the Route) into
// a regular expression that will match any named parameters.
//
// path - The path as specified in the <Route ... />.
//
// Examples:
//
//   reRoute('/blog/{year}/{month}/{day}')
const reRoute = (path) => {
  const withCaptures = path.replace(/\{([^}]+)\}/g, '(?<$1>[^/]+)')
  return `^${withCaptures}$`
}

// Determine if the given route is a match for the given pathname. If so,
// extract any named params and return them in an object.
//
// route    - The route path as specified in the <Route path={...} />
// pathname - The pathname from the window.location.
//
// Examples:
//
//   matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')
//   => { match: true, params: { year: '2019', month: '12', day: '07' }}
//
//   matchPath('/about', '/')
//   => { match: false }
const matchPath = (route, pathname) => {
  const matches = Array.from(pathname.matchAll(reRoute(route)))
  if (matches.length > 0) {
    const params = matches[0].groups || {}
    return { match: true, params }
  } else {
    return { match: false }
  }
}

// Parse the given search string into key/value pairs and return them in an
// object.
//
// Examples:
//
//   parseSearch('?key1=val1&key2=val2')
//   => { key1: 'val1', key2: 'val2' }
const parseSearch = (search) => {
  if (search === '') {
    return {}
  }
  const searchPart = search.substring(1)
  const pairs = searchPart.split('&')
  const searchProps = {}
  pairs.forEach((pair) => {
    const keyval = pair.split('=')
    searchProps[keyval[0]] = keyval[1] || ''
  })
  return searchProps
}

// Create a React Context with the given name.
const createNamedContext = (name, defaultValue) => {
  const Ctx = React.createContext(defaultValue)
  Ctx.displayName = name
  return Ctx
}

const LocationContext = createNamedContext('Location')

const Location = ({ children }) => (
  <LocationContext.Consumer>
    {(context) =>
      context ? (
        children(context)
      ) : (
        <LocationProvider>{children}</LocationProvider>
      )
    }
  </LocationContext.Consumer>
)

const createHistory = () => {
  const listeners = []

  return {
    listen: (listener) => {
      listeners.push(listener)
      window.addEventListener('popstate', () => {
        listener()
      })
    },
    navigate: (to) => {
      window.history.pushState({}, null, to)
      listeners.forEach((listener) => listener())
    },
  }
}

const gHistory = createHistory()

export const navigate = gHistory.navigate

class LocationProvider extends React.Component {
  static defaultProps = {
    location: window.location,
  }

  state = {
    context: this.getContext(),
  }

  getContext() {
    const { pathname, search, hash } = this.props.location
    return { pathname, search, hash }
  }

  componentDidMount() {
    gHistory.listen(() => {
      this.setState(() => ({ context: this.getContext() }))
    })
  }

  render() {
    let { children } = this.props
    let { context } = this.state
    return (
      <LocationContext.Provider value={context}>
        {typeof children === 'function' ? children(context) : children || null}
      </LocationContext.Provider>
    )
  }
}

export const Router = (props) => (
  <Location>
    {(locationContext) => <RouterImpl {...locationContext} {...props} />}
  </Location>
)

const ParamsContext = createNamedContext('Params', {})

// The first time the routes are loaded, iterate through them and create the named
// route functions.

let namedRoutes = {}
let namedRoutesDone = false

// Validate a path to make sure it follows the router's rules. If any problems
// are found, a descriptive Error will be thrown, as problems with routes are
// critical enough to be considered fatal.
const validatePath = (path) => {
  // Check that path begins with a slash.
  if (path[0] !== '/') {
    throw new Error('Route path does not begin with a slash: "' + path + '"')
  }

  // Check for duplicate named params.
  const matches = path.matchAll(/\{([^}]+)\}/g)
  let memo = {}
  for (const match of matches) {
    const param = match[0]
    if (memo[param]) {
      throw new Error('Route path contains duplicate parameter: "' + path + '"')
    } else {
      memo[match[0]] = true
    }
  }
}

// Take a given route path and replace any named parameters with those in the
// given args object. Any extra params not used in the path will be appended
// as key=value pairs in the search part.
//
// Examples:
//     replaceParams('/tags/{tag}', { tag: 'code', extra: 'foo' })
//     => '/tags/code?extra=foo
const replaceParams = (path, args = {}) => {
  // Split the path apart and replace named parameters with those sent in,
  // then join it back together.
  const parts = path.split('/')
  let newPath = parts
    .map((part) => {
      if (part[0] === '{' && part[part.length - 1] === '}') {
        const paramName = part.substr(1, part.length - 2)
        const arg = args[paramName]
        if (arg) {
          delete args[paramName]
          return arg
        }
      }
      return part
    })
    .join('/')

  // Prepare any unnamed params to be be appended as search params.
  const queryParams = []
  Object.keys(args).forEach((key) => {
    queryParams.push(`${key}=${args[key]}`)
  })

  // Append any unnamed params as search params.
  if (queryParams.length) {
    newPath += `?${queryParams.join('&')}`
  }

  return newPath
}

const mapNamedRoutes = (routes) => {
  for (let route of routes) {
    const { path, name, notfound } = route.props

    // Skip the notfound route.
    if (notfound) {
      continue
    }

    // Check for issues with the path.
    validatePath(path)

    // Create the named route function for this route.
    namedRoutes[name] = (args = {}) => replaceParams(path, args)
  }

  // Only need to do this once.
  namedRoutesDone = true
}

export const routes = namedRoutes

// The guts of the router implementation.

const RouterImpl = ({ pathname, search, children }) => {
  const routes = React.Children.toArray(children)
  if (!namedRoutesDone) {
    mapNamedRoutes(routes)
  }

  let NotFoundPage

  for (let route of routes) {
    const { path, page: Page, redirect, notfound } = route.props
    if (notfound) {
      NotFoundPage = Page
      continue
    }
    const { match, params: pathParams } = matchPath(path, pathname)
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
        return (
          <ParamsContext.Provider value={allParams}>
            <Page {...allParams} />
          </ParamsContext.Provider>
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
      <NotFoundPage />
    </ParamsContext.Provider>
  )
}

export const Route = () => {
  return null
}

export const Link = ({ to, ...rest }) => (
  <a
    href={to}
    {...rest}
    onClick={(event) => {
      event.preventDefault()
      navigate(to)
    }}
  />
)

export const NavLink = ({ to, className, activeClassName, ...rest }) => {
  const context = useContext(LocationContext)
  const theClassName = to === context.pathname ? activeClassName : className
  return (
    <a
      href={to}
      className={theClassName}
      {...rest}
      onClick={(event) => {
        event.preventDefault()
        navigate(to)
      }}
    />
  )
}

export const useParams = () => {
  const params = useContext(ParamsContext)
  return params
}
