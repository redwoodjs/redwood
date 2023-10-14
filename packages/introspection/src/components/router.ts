import { getPaths } from '@redwoodjs/project-config'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'
import { RedwoodRoute } from './route'

export class RedwoodRouter extends RedwoodIntrospectionComponent {
  readonly type = 'router'

  readonly routes: RedwoodRoute[]

  private constructor(filepath: string) {
    super(filepath)

    this.routes = RedwoodRoute.parseRoutes(this)
  }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = []

    // Not found route checks
    const notFoundRoutes = this.routes.filter((route) => {
      return route.isNotFound
    })
    if (notFoundRoutes.length === 0) {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No "notfound" route detected',
      })
    } else if (notFoundRoutes.length > 1) {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No more than one "notfound" route should be present',
      })
    }

    // Duplicate routes checking
    const nameOccurences: Record<string, number> = {}
    this.routes.forEach((route) => {
      if (route.name in nameOccurences && nameOccurences[route.name] < 2) {
        errors.push({
          component: {
            type: this.type,
            filepath: this.filepath,
            name: this.name,
          },
          message: `Multiple routes named "${route.name}" are present`,
        })
        nameOccurences[route.name] += 1
      } else {
        nameOccurences[route.name] = 1
      }
    })

    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    const warnings: RedwoodIntrospectionWarning[] = []

    if (this.routes.length === 0) {
      warnings.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No routes found',
      })
    }

    return warnings
  }

  static parseRouter(filepath = getPaths().web.routes) {
    return new RedwoodRouter(filepath)
  }
}
