import chalk from 'chalk'

import { getPaths } from './paths'

// Circular dependency when trying to use the standard import
const {
  RedwoodProject,
} = require('@redwoodjs/skeleton/dist/components/project')
const { RedwoodRoute } = require('@redwoodjs/skeleton/dist/components/route')

export interface RouteInformation {
  name?: string
  path?: string
  page?: string
}

/**
 * Returns an array of routes which conflict on their defined names
 */
export function getDuplicateRoutes() {
  const duplicateRoutes: RouteInformation[] = []
  const allRoutes: (typeof RedwoodRoute)[] = RedwoodProject.getProject({
    pathWithinProject: getPaths().base,
  }).getRouters()[0].routes // TODO: Assumes that we want the first router (only router right now)
  const uniquePathNames = new Set(allRoutes.map((route) => route.name))
  uniquePathNames.forEach((name) => {
    const routesWithName = allRoutes.filter((route) => {
      return route.name === name
    })
    if (routesWithName.length > 1) {
      duplicateRoutes.push(
        ...routesWithName.map((route) => {
          return {
            name: route.name,
            page: route.pageIdentifier,
            path: route.path,
          }
        })
      )
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
