import React, { Children, isValidElement, ReactElement, ReactNode } from 'react'

import {
  isNotFoundRoute,
  isRedirectRoute,
  isStandardRoute,
  isValidRoute,
} from './route-validators'
import { PageType } from './router'
import { isPrivateNode, isSetNode } from './Set'

/** Create a React Context with the given name. */
export function createNamedContext<T>(name: string, defaultValue?: T) {
  const Ctx = React.createContext<T | undefined>(defaultValue)
  Ctx.displayName = name
  return Ctx
}

export function flattenAll(children: ReactNode): ReactNode[] {
  const childrenArray = Children.toArray(children)

  return childrenArray.flatMap((child) => {
    if (isValidElement(child) && child.props.children) {
      return [child, ...flattenAll(child.props.children)]
    }

    return [child]
  })
}
/**
 * Get param name, type, and match for a route.
 *
 *  '/blog/{year}/{month}/{day:Int}/{filePath...}'
 *   => [
 *        ['year',     'String', '{year}'],
 *        ['month',    'String', '{month}'],
 *        ['day',      'Int',    '{day:Int}'],
 *        ['filePath', 'Glob',   '{filePath...}']
 *      ]
 *
 * Only exported to be able to test it
 */
export function paramsForRoute(route: string) {
  // Match the strings between `{` and `}`.
  const params = [...route.matchAll(/\{([^}]+)\}/g)]

  return params
    .map((match) => match[1])
    .map((match) => {
      const parts = match.split(':')

      // Normalize the name
      let name = parts[0]
      if (name.slice(-3) === '...') {
        // Globs have their ellipsis removed
        name = name.slice(0, -3)
      }

      // Determine the type
      let type = parts[1]
      if (!type) {
        // Strings and Globs are implicit in the syntax
        type = match.slice(-3) === '...' ? 'Glob' : 'String'
      }

      return [name, type, `{${match}}`]
    })
}

export type TrailingSlashesTypes = 'never' | 'always' | 'preserve'

export interface ParamType {
  match?: RegExp
  parse?: (value: any) => unknown
}

/** Definitions of the core param types. */
const coreParamTypes: Record<string, ParamType> = {
  String: {
    match: /[^/]+/,
  },
  Int: {
    match: /\d+/,
    parse: Number,
  },
  Float: {
    match: /[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/,
    parse: Number,
  },
  Boolean: {
    match: /true|false/,
    parse: (boolAsString: string) => boolAsString === 'true',
  },
  Glob: {
    match: /.*/,
  },
}

type SupportedRouterParamTypes = keyof typeof coreParamTypes

/**
 * Determine if the given route is a match for the given pathname. If so,
 * extract any named params and return them in an object.
 *
 * route         - The route path as specified in the <Route path={...} />
 * pathname      - The pathname from the window.location.
 * paramTypes    - The object containing all param type definitions.
 * matchSubPaths - Also match sub routes
 *
 * Examples:
 *
 *  matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')
 *  => { match: true, params: { year: '2019', month: '12', day: '07' }}
 *
 *  matchPath('/about', '/')
 *  => { match: false }
 *
 *  matchPath('/post/{id:Int}', '/post/7')
 *  => { match: true, params: { id: 7 }}
 *
 *  matchPath('/post/1', '/post/', { matchSubPaths: true })
 *  => { match: true, params: {} }
 */
export function matchPath(
  routeDefinition: string,
  pathname: string,
  {
    userParamTypes,
    matchSubPaths,
  }: {
    userParamTypes?: Record<string, ParamType>
    matchSubPaths?: boolean
  } = {
    userParamTypes: {},
    matchSubPaths: false,
  }
) {
  // Get the names and the transform types for the given route.
  const allParamTypes = { ...coreParamTypes, ...userParamTypes }

  const { matchRegex, routeParams: routeParamsDefinition } =
    getRouteRegexAndParams(routeDefinition, {
      matchSubPaths,
      allParamTypes,
    })

  // Does the `pathname` match the route?
  const matches = [...pathname.matchAll(matchRegex)]

  if (matches.length === 0) {
    return { match: false }
  }
  // Map extracted values to their param name, casting the value if needed
  const providedParams = matches[0].slice(1)

  // @NOTE: refers to definiton e.g. '/page/{id}', not the actual params
  if (routeParamsDefinition.length > 0) {
    const params = providedParams.reduce<Record<string, unknown>>(
      (acc, value, index) => {
        const [name, transformName] = routeParamsDefinition[index]
        const typeInfo =
          allParamTypes[transformName as SupportedRouterParamTypes]

        let transformedValue: string | unknown = value
        if (typeof typeInfo?.parse === 'function') {
          transformedValue = typeInfo.parse(value)
        }

        return {
          ...acc,
          [name]: transformedValue,
        }
      },
      {}
    )
    return { match: true, params }
  }

  return { match: true }
}

interface GetRouteRegexOptions {
  matchSubPaths?: boolean
  allParamTypes?: Record<string, ParamType> // Pass in paramTypes to match, if user has custom param types
}
/**
 *  This function will return a regex for each route path i.e. /blog/{year}/{month}/{day}
 *  will return a regex like /blog/([^/$1*]+)/([^/$1*]+)/([^/$1*]+)
 *
 * @returns
 */

export function getRouteRegexAndParams(
  route: string,
  {
    matchSubPaths = false,
    allParamTypes = coreParamTypes,
  }: GetRouteRegexOptions | undefined = {}
) {
  let typeMatchingRoute = route
  const routeParams = paramsForRoute(route)

  // Map all params from the route to their type `match` regexp to create a
  // "type-matching route" regexp
  // /recipe/{id} -> /recipe/([^/$1*]+)
  for (const [_name, type, match] of routeParams) {
    // `undefined` matcher if `type` is not supported
    const matcher = allParamTypes[type as SupportedRouterParamTypes]?.match

    // Get the regex as a string, or default regexp if `match` is not specified
    const typeRegexp = matcher?.source || '[^/]+'

    typeMatchingRoute = typeMatchingRoute.replace(match, `(${typeRegexp})`)
  }

  const matchRegex = matchSubPaths
    ? new RegExp(`^${typeMatchingRoute}(?:/.*)?$`, 'g')
    : new RegExp(`^${typeMatchingRoute}$`, 'g')

  const matchRegexString = matchSubPaths
    ? `^${typeMatchingRoute}(?:/.*)?$`
    : `^${typeMatchingRoute}$`

  return {
    matchRegex,
    routeParams,
    matchRegexString,
  }
}

/**
 * Parse the given search string into key/value pairs and return them in an
 * object.
 *
 * Examples:
 *
 *  parseSearch('?key1=val1&key2=val2')
 *  => { key1: 'val1', key2: 'val2' }
 *
 * @fixme
 * This utility ignores keys with multiple values such as `?foo=1&foo=2`.
 */
export function parseSearch(
  search:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined
) {
  const searchParams = new URLSearchParams(search)

  return [...searchParams.keys()].reduce(
    (params, key) => ({
      ...params,
      [key]: searchParams.get(key),
    }),
    {}
  )
}

/**
 * Validate a path to make sure it follows the router's rules. If any problems
 * are found, a descriptive Error will be thrown, as problems with routes are
 * critical enough to be considered fatal.
 */
export function validatePath(path: string, routeName: string) {
  // Check that path begins with a slash.
  if (!path.startsWith('/')) {
    throw new Error(
      `Route path for ${routeName} does not begin with a slash: "${path}"`
    )
  }

  if (path.indexOf(' ') >= 0) {
    throw new Error(`Route path for ${routeName} contains spaces: "${path}"`)
  }

  if (/{(?:ref|key)(?::|})/.test(path)) {
    throw new Error(
      [
        `Route for ${routeName} contains ref or key as a path parameter: "${path}"`,
        "`ref` and `key` shouldn't be used as path parameters because they're special React props.",
        'You can fix this by renaming the path parameter.',
      ].join('\n')
    )
  }

  // Check for duplicate named params.
  const matches = path.matchAll(/\{([^}]+)\}/g)
  const memo: Record<string, boolean> = {}
  for (const match of matches) {
    // Extract the param's name to make sure there aren't any duplicates
    const param = match[1].split(':')[0]
    if (memo[param]) {
      throw new Error(`Route path contains duplicate parameter: "${path}"`)
    } else {
      memo[param] = true
    }
  }
}

/**
 * Take a given route path and replace any named parameters with those in the
 * given args object. Any extra params not used in the path will be appended
 * as key=value pairs in the search part.
 *
 * Examples:
 *
 *   replaceParams('/tags/{tag}', { tag: 'code', extra: 'foo' })
 *   => '/tags/code?extra=foo
 */
export function replaceParams(
  route: string,
  args: Record<string, unknown> = {}
) {
  const params = paramsForRoute(route)
  let path = route

  // Replace all params in the route with their values
  params.forEach((param) => {
    const [name, _type, match] = param
    const value = args[name]
    if (value !== undefined) {
      path = path.replace(match, value as string)
    } else {
      throw new Error(
        `Missing parameter '${name}' for route '${route}' when generating a navigation URL.`
      )
    }
  })

  const paramNames = params.map((param) => param[0])
  const extraArgKeys = Object.keys(args).filter((x) => !paramNames.includes(x))

  // Prepare any unnamed params to be be appended as search params.
  const queryParams: string[] = []
  extraArgKeys.forEach((key) => {
    queryParams.push(`${key}=${args[key]}`)
  })

  // Append any unnamed params as search params.
  if (queryParams.length) {
    path += `?${queryParams.join('&')}`
  }

  return path
}

/**
 *
 * @param {string} queryString
 * @returns {Array<string | Record<string, any>>} A flat array of search params
 *
 * useMatch hook options searchParams requires a flat array
 *
 * Examples:
 *
 *  parseSearch('?key1=val1&key2=val2')
 *  => { key1: 'val1', key2: 'val2' }
 *
 * flattenSearchParams(parseSearch('?key1=val1&key2=val2'))
 * => [ { key1: 'val1' }, { key2: 'val2' } ]
 *
 */
export function flattenSearchParams(
  queryString: string
): Array<string | Record<string, any>> {
  const searchParams = []

  for (const [key, value] of Object.entries(parseSearch(queryString))) {
    searchParams.push({ [key]: value })
  }

  return searchParams
}

export interface Spec {
  name: string
  prerenderLoader: (name?: string) => { default: React.ComponentType<unknown> }
  LazyComponent:
    | React.LazyExoticComponent<React.ComponentType<unknown>>
    | React.ComponentType<unknown>
}

export function isSpec(
  specOrPage: Spec | React.ComponentType
): specOrPage is Spec {
  return (specOrPage as Spec).LazyComponent !== undefined
}

/**
 * Pages can be imported automatically or manually. Automatic imports are actually
 * objects and take the following form (which we call a 'spec'):
 *
 *   const WhateverPage = {
 *     name: 'WhateverPage',
 *     LazyComponent: lazy(() => import('src/pages/WhateverPage'))
 *     prerenderLoader: ...
 *   }
 *
 * Manual imports simply load the page:
 *
 *   import WhateverPage from 'src/pages/WhateverPage'
 *
 * Before passing a "page" to the PageLoader, we will normalize the manually
 * imported version into a spec.
 */
export function normalizePage(
  specOrPage: Spec | React.ComponentType<unknown>
): Spec {
  if (isSpec(specOrPage)) {
    // Already a spec, just return it.
    return specOrPage
  }

  // Wrap the Page in a fresh spec, and put it in a promise to emulate
  // an async module import.
  return {
    name: specOrPage.name,
    prerenderLoader: () => ({ default: specOrPage }),
    LazyComponent: specOrPage,
  }
}

/**
 * Detect if we're in an iframe.
 *
 * From https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
 */
export function inIframe() {
  try {
    return global?.self !== global?.top
  } catch (e) {
    return true
  }
}
interface AnayzeRoutesOptions {
  currentPathName: string
  userParamTypes?: Record<string, ParamType>
}

// This is essentially the same as RouteProps
// but it allows for page and redirect to be null or undefined
// Keeping the shape consistent makes it easier to use

type WhileLoadingPage = () => ReactElement | null

// Not using AvailableRoutes because the type is generated in the user's project
// We can't index it correctly in the framework
export type GeneratedRoutesMap = {
  [key: string]: (
    args?: Record<string | number, string | number | boolean>
  ) => string
}

type RoutePath = string
export type Wrappers = Array<(props: any) => ReactNode>
interface AnalyzedRoute {
  path: RoutePath
  name: string | null
  whileLoadingPage?: WhileLoadingPage
  page: PageType | null
  redirect: string | null
  wrappers: Wrappers
  setProps: Record<any, any>
  setId: number
}

export function analyzeRoutes(
  children: ReactNode,
  { currentPathName, userParamTypes }: AnayzeRoutesOptions
) {
  const pathRouteMap: Record<RoutePath, AnalyzedRoute> = {}
  const namedRoutesMap: GeneratedRoutesMap = {}
  let hasHomeRoute = false
  let NotFoundPage: PageType | undefined
  let activeRoutePath: string | undefined

  interface RecurseParams {
    nodes: ReturnType<typeof Children.toArray>
    whileLoadingPageFromSet?: WhileLoadingPage
    wrappersFromSet?: Wrappers
    // we don't know, or care about, what props users are passing down
    propsFromSet?: Record<string, unknown>
    setId?: number
  }

  // Track the number of sets found.
  // Because Sets are virtually rendered we can use this setId as a key to properly manage re-rendering
  // When using the same wrapper Component for different Sets
  // Example:
  //   <Router>
  //   <Set wrap={SetContextProvider}>
  //     <Route path="/" page={HomePage} name="home" />
  //     <Route path="/ctx-1-page" page={Ctx1Page} name="ctx1" />
  //     <Route path="/ctx-2-page" page={Ctx2Page} name="ctx2" />
  //   </Set>
  //   <Set wrap={SetContextProvider}>
  //     <Route path="/ctx-3-page" page={Ctx3Page} name="ctx3" />
  //   </Set>
  // </Router>
  let setId = 0

  const recurseThroughRouter = ({
    nodes,
    whileLoadingPageFromSet,
    wrappersFromSet = [],
    propsFromSet: previousSetProps = {},
  }: RecurseParams) => {
    nodes.forEach((node) => {
      if (isValidRoute(node)) {
        // Just for readability
        const route = node

        // We don't add not found pages to our list of named routes
        if (isNotFoundRoute(route)) {
          NotFoundPage = route.props.page
          // Dont add notFound routes to the maps, and exit early
          // @TODO: We may need to add it to the map, because you can in
          // theory wrap a notfound page in a Set wrapper
          return
        }

        // Used to decide whether to display SplashPage
        if (route.props.path === '/') {
          hasHomeRoute = true
        }

        if (isRedirectRoute(route)) {
          const { name, redirect, path } = route.props

          // The name is just for showing a human-readable error message
          validatePath(path, name || path)

          const { match } = matchPath(path, currentPathName, {
            userParamTypes,
          })

          // Check if we already have an active path to only return the first match
          if (match && !activeRoutePath) {
            activeRoutePath = path
          }

          // If the redirect route doesn't have a name, no need to add it to the map
          pathRouteMap[path] = {
            redirect,
            name: name || null,
            path,
            page: null, // Redirects don't need pages. We set this to null for consistency
            wrappers: wrappersFromSet,
            setProps: previousSetProps,
            setId,
          }

          if (name) {
            namedRoutesMap[name] = (args = {}) => replaceParams(path, args)
          }
        }

        if (isStandardRoute(route)) {
          const { name, path, page } = route.props
          // Will throw if invalid path
          validatePath(path, name)

          const { match } = matchPath(path, currentPathName, {
            userParamTypes,
          })

          // Check if we already have an active path to only return the first match
          if (match && !activeRoutePath) {
            activeRoutePath = path
          }

          // e.g. namePathMap['homePage'] = { name: 'homePage', path: '/home', ...}
          // We always set all the keys, even if their values are null/undefined for consistency
          pathRouteMap[path] = {
            redirect: null,
            name,
            path,
            whileLoadingPage:
              route.props.whileLoadingPage || whileLoadingPageFromSet,
            page: page,
            wrappers: wrappersFromSet,
            setProps: previousSetProps,
            setId,
          }

          // e.g. namedRoutesMap.homePage = () => '/home'
          namedRoutesMap[name] = (args = {}) => replaceParams(path, args)
        }
      }

      // @NOTE: A <Private> is also a Set
      if (isSetNode(node)) {
        setId = setId + 1 // increase the Set id for each Set found
        const {
          children,
          whileLoadingPage: whileLoadingPageFromCurrentSet,
          wrap: wrapFromCurrentSet,
          ...otherPropsFromCurrentSet
        } = node.props

        let wrapperComponentsArray = []
        if (wrapFromCurrentSet) {
          wrapperComponentsArray = Array.isArray(wrapFromCurrentSet)
            ? wrapFromCurrentSet
            : [wrapFromCurrentSet]
        }

        // @MARK note unintuitive, but intentional
        // You cannot make a nested set public if the parent is private
        // i.e. the private prop cannot be overriden by a child Set
        const privateProps =
          isPrivateNode(node) || previousSetProps.private
            ? { private: true }
            : {}

        if (children) {
          recurseThroughRouter({
            nodes: Children.toArray(children),
            // When there's a whileLoadingPage prop on a Set, we pass it down to all its children
            // If the parent node was also a Set with whileLoadingPage, we pass it down. The child's whileLoadingPage
            // will always take precedence over the parent's
            whileLoadingPageFromSet:
              whileLoadingPageFromCurrentSet || whileLoadingPageFromSet,
            setId,
            wrappersFromSet: [...wrappersFromSet, ...wrapperComponentsArray],
            propsFromSet: {
              ...previousSetProps,
              // Current one takes precedence
              ...otherPropsFromCurrentSet,
              // See comment at definiion, intenionally at the end
              ...privateProps,
            },
          })
        }
      }
    })
  }

  recurseThroughRouter({ nodes: Children.toArray(children) })

  return {
    pathRouteMap,
    namedRoutesMap,
    hasHomeRoute,
    NotFoundPage,
    activeRoutePath,
  }
}
