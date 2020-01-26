// Create a React Context with the given name.
const createNamedContext = (name, defaultValue) => {
  const Ctx = React.createContext(defaultValue)
  Ctx.displayName = name
  return Ctx
}

// Separator token used during param type recognition.
const separator = '__redwood_param_type__'

// Convert the given path (from the path specified in the Route) into a regular
// expression that will match any named parameters. Param types are handled here
// as well.
//
// path          - The path as specified in the <Route ... />.
// allParamTypes - The object containing all param type definitions.
//
// Examples:
//
//   reRoute('/blog/{year}/{month}/{day}', { ... })
//   reRoute('/post/{id:Int}', { Int: { ... }})
const reRoute = (path, allParamTypes) => {
  let pathWithCaptures = path

  Object.keys(allParamTypes).forEach((pType) => {
    const { constraint: pConstraint } = allParamTypes[pType]
    const regex = new RegExp(`\{([^}]+):${pType}\}`, 'g')
    const constraintString = pConstraint.toString()
    const constraint = constraintString.substring(
      1,
      constraintString.length - 1
    )
    const capture = `(?<$1${separator}${pType}>${constraint})`
    pathWithCaptures = pathWithCaptures.replace(regex, capture)
  })

  pathWithCaptures = pathWithCaptures.replace(/\{([^}]+)\}/g, '(?<$1>[^/]+)')

  return `^${pathWithCaptures}$`
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
const matchPath = (route, pathname, allParamTypes) => {
  const matches = Array.from(pathname.matchAll(reRoute(route, allParamTypes)))
  if (matches.length > 0) {
    const params = matches[0].groups || {}

    // Handle param types.
    const transformedParams = Object.keys(params).reduce((acc, key) => {
      const pMatches = key.match(`^(\\w+)${separator}(\\w+)$`)

      if (pMatches && pMatches.length > 0) {
        const [_, pName, pType] = pMatches
        acc[pName] = allParamTypes[pType].transform(params[key])
      } else {
        acc[key] = params[key]
      }

      return acc
    }, {})

    return { match: true, params: transformedParams }
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
  reRoute,
  matchPath,
  parseSearch,
  validatePath,
  replaceParams,
}
