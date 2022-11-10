import fs from 'fs'

import chalk from 'chalk'

import { getPaths } from './paths'

export interface Route {
  name?: string
  path?: string
  page?: string // All valid routes should have a page but it's optional here for convenience
}

/**
 * Extracts all the routes defined within the Routes.(js|tsx) file
 */
export function getRoutes() {
  const routes: Route[] = []

  const routesFile = fs.readFileSync(getPaths().web.routes, {
    encoding: 'utf8',
    flag: 'r',
  })

  // Strip out commented code
  let routesWithoutComments = routesFile
  let startPosition = routesWithoutComments.indexOf('{/*')
  let endPosition = -1
  while (startPosition !== -1) {
    endPosition = routesWithoutComments.indexOf('*/}')
    routesWithoutComments =
      routesWithoutComments.substring(0, startPosition) +
      routesWithoutComments.substring(endPosition + 3)
    startPosition = routesWithoutComments.indexOf('{/*')
  }

  const routeRE = /<Route (.*?)\/>/g
  const nameRE = /(name)=\s*(?:"([^"]*)"|(\S+))/g
  const pathRE = /(path)=\s*(?:"([^"]*)"|(\S+))/g
  const pageRE = /(page)=\s*(?:{([^}]*)}|(\S+))/g

  const routesInFile = routesWithoutComments.match(routeRE)
  if (routesInFile) {
    for (const route of routesInFile) {
      const name = route.match(nameRE)?.at(0)?.split('=')[1].slice(1, -1)
      const path = route.match(pathRE)?.at(0)?.split('=')[1].slice(1, -1)
      const page = route.match(pageRE)?.at(0)?.split('=')[1].slice(1, -1)
      routes.push({ name, path, page })
    }
  }

  return routes
}

/**
 * Returns an array of routes which conflict on their defined names
 */
export function getDuplicateRoutes() {
  const duplicateRoutes: Route[] = []
  const routes = getRoutes()
  const uniqueNames = routes
    .map((route) => {
      return route.name
    })
    .filter((value, index, self) => {
      return self.indexOf(value) === index
    })
  uniqueNames.forEach((name) => {
    const routesWithName = routes.filter((route) => {
      return route.name === name
    })
    if (routesWithName.length > 1) {
      duplicateRoutes.push(...routesWithName)
    }
  })
  return duplicateRoutes
}

/**
 * Detects any potential duplicate routes and returns a formatted warning message
 * @see {@link getDuplicateRoutes} for how duplicate routes are detected
 * @return {string} Warning message when duplicate routes found, empty string if not
 */
export function warningForDuplicateRoutes() {
  const duplicatedRoutes = getDuplicateRoutes()
  let message = ''
  if (duplicatedRoutes.length > 0) {
    message += chalk.keyword('orange')(
      `Warning: ${duplicatedRoutes.length} duplicate routes have been detected, only the route(s) closest to the top of the file will be used.\n`
    )
    duplicatedRoutes.forEach((route) => {
      message += ` ${chalk.keyword('orange')('->')} Name: "${
        route.name
      }", Path: "${route.path}", Page: "${route.page}"\n`
    })
  }
  return message.trimEnd()
}
