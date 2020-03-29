// Create a React Context with the given name.
const createNamedContext = (name, defaultValue) => {
  const Ctx = React.createContext(defaultValue)
  Ctx.displayName = name
  return Ctx
}

// Get param name and type tranform for a route
//
// '/blog/{year}/{month}/{day:Int}' => [['year'], ['month'], ['day', 'Int']]
const paramsForType = (route) => {
  // Match the strings between `{` and `}`.
  const params = [...route.matchAll(/\{([^}]+)\}/g)]
  return params
    .map((match) => match[1])
    .map((match) => {
      return match.split(':')
    })
}

// Definitions of the core param types.
const coreParamTypes = {
  Int: {
    constraint: /^\d+$/,
    transform: Number,
  },
}

// Determine if the given route is a match for the given pathname. If so,
// extract any named params and return them in an object.
//
// route         - The route path as specified in the <Route path={...} />
// pathname      - The pathname from the window.location.
// allParamTypes - The object containing all param type definitions.
//
// Examples:
//
//   matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')
//   => { match: true, params: { year: '2019', month: '12', day: '07' }}
//
//   matchPath('/about', '/')
//   => { match: false }
//
//   matchPath('/post/{id:Int}', '/post/7')
//   => { match: true, params: { id: 7 }}
const matchPath = (route, pathname, paramTypes) => {
  // Does the `pathname` match the `route`?
  const matches = [
    ...pathname.matchAll(`^${route.replace(/\{([^}]+)\}/g, '([^/]+)')}$`),
  ]

  if (matches.length === 0) {
    return { match: false }
  }

  const allParamTypes = { ...coreParamTypes, ...paramTypes }

  // Get the names and the transform types for the given route.
  const paramInfo = paramsForType(route)
  const params = matches[0].slice(1).reduce((acc, value, index) => {
    const [name, transformName] = paramInfo[index]

    if (transformName) {
      value = allParamTypes[transformName].transform(value)
    }

    return {
      ...acc,
      [name]: value,
    }
  }, {})

  return { match: true, params }
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
        const paramSpec = part.substr(1, part.length - 2)
        const paramName = paramSpec.split(':')[0]
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

export {
  createNamedContext,
  matchPath,
  parseSearch,
  validatePath,
  replaceParams,
}
