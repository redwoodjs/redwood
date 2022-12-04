import fs from 'fs'
import path from 'path'

import { RedwoodSkeleton } from './base'
import { RedwoodProject } from './project'
import { extractRoutes, RedwoodRoute } from './route'
import { extractSides, RedwoodSide, RedwoodSideType } from './side'

export class RedwoodRouter extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly routes: RedwoodRoute[]

  constructor(filepath: string) {
    super(filepath)

    // TODO: Consider if immediately processing the routes should be optional
    this.routes = extractRoutes(this)

    // TODO: Implement checks
    // duplicate routes
    // only one not found page
    // check a not found page exists
  }

  getSide(): RedwoodSide {
    const project = RedwoodProject.getProject({
      pathWithinProject: this.filepath,
    })
    const sides = project.getSides()
    const side = sides.find((side) => {
      return this.filepath.startsWith(side.filepath)
    })
    if (side) {
      return side
    }
    throw new Error('Could not determine which side the router belongs to.')
  }

  // Diagnostics

  getInformation(): string {
    return '' // TODO: Implement
  }
}

export function extractRouter(filepath: string): RedwoodRouter {
  return new RedwoodRouter(filepath)
}

export function extractRouters(
  project: RedwoodProject | undefined = undefined
): RedwoodRouter[] {
  const routers: RedwoodRouter[] = []

  const routerFiles: string[] = []
  const sides = project ? project.getSides() : extractSides(undefined)
  sides
    ?.filter((side) => {
      // Extract only sides which support a router
      return side.type === RedwoodSideType.WEB
    })
    .forEach((side) => {
      // Find the router file and create a RedwoodRouter
      let routerFileName = ''
      switch (side.type) {
        case RedwoodSideType.WEB:
          routerFileName = fs
            .readdirSync(path.join(side.filepath, 'src'))
            .filter((path) => {
              return path.match(/Routes\.(js|jsx|tsx)$/)
            })[0]
          // TODO: fix: Assumes the router file exists
          routerFiles.push(path.join(side.filepath, 'src', routerFileName))
          break
        default:
          // TODO: Determine how to handle this
          break
      }
    })

  routerFiles.forEach((routerFile) => {
    routers.push(new RedwoodRouter(routerFile))
  })

  return routers
}
