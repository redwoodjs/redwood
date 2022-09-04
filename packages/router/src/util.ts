import React, { Children, ReactElement, ReactNode } from 'react'

/** Create a React Context with the given name. */
export const createNamedContext = <T>(name: string, defaultValue?: T) => {
  const Ctx = React.createContext<T | undefined>(defaultValue)
  Ctx.displayName = name
  return Ctx
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
export const paramsForRoute = (route: string) => {
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
 * allParamTypes - The object containing all param type definitions.
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
 */
export const matchPath = (
  route: string,
  pathname: string,
  paramTypes?: Record<string, ParamType>
) => {
  // Get the names and the transform types for the given route.
  const routeParams = paramsForRoute(route)
  const allParamTypes = { ...coreParamTypes, ...paramTypes }
  let typeMatchingRoute = route

  // Map all params from the route to their type `match` regexp to create a
  // "type-matching route" regexp
  for (const [_name, type, match] of routeParams) {
    // `undefined` matcher if `type` is not supported
    const matcher = allParamTypes[type as SupportedRouterParamTypes]?.match

    // Get the regex as a string, or default regexp if `match` is not specified
    const typeRegexp = matcher?.source || '[^/]+'

    typeMatchingRoute = typeMatchingRoute.replace(match, `(${typeRegexp})`)
  }

  // Does the `pathname` match the route?
  const matches = [
    ...pathname.matchAll(new RegExp(`^${typeMatchingRoute}$`, 'g')),
  ]

  if (matches.length === 0) {
    return { match: false }
  }

  // Map extracted values to their param name, casting the value if needed
  const providedParams = matches[0].slice(1)
  const params = providedParams.reduce<Record<string, unknown>>(
    (acc, value, index) => {
      const [name, transformName] = routeParams[index]
      const typeInfo = allParamTypes[transformName as SupportedRouterParamTypes]

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
export const parseSearch = (
  search:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined
) => {
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
export const validatePath = (path: string) => {
  // Check that path begins with a slash.
  if (!path.startsWith('/')) {
    throw new Error(`Route path does not begin with a slash: "${path}"`)
  }

  if (path.indexOf(' ') >= 0) {
    throw new Error(`Route path contains spaces: "${path}"`)
  }

  if (/{(?:ref|key)(?::|})/.test(path)) {
    throw new Error(
      [
        `Route contains ref or key as a path parameter: "${path}"`,
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
export const replaceParams = (
  route: string,
  args: Record<string, unknown> = {}
) => {
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

export function isReactElement(node: ReactNode): node is ReactElement {
  return (
    node !== undefined &&
    node !== null &&
    (node as ReactElement).type !== undefined
  )
}

export function flattenAll(children: ReactNode): ReactNode[] {
  const childrenArray = Children.toArray(children)

  return childrenArray.flatMap((child) => {
    if (isReactElement(child) && child.props.children) {
      return [child, ...flattenAll(child.props.children)]
    }

    return [child]
  })
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
  loader: () => Promise<{ default: React.ComponentType<unknown> }>
}

export function isSpec(
  specOrPage: Spec | React.ComponentType
): specOrPage is Spec {
  return (specOrPage as Spec).loader !== undefined
}

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
    loader: async () => ({ default: specOrPage }),
  }
}
