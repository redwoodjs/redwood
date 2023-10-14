import fs from 'node:fs'
import path from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

import type { RedwoodCell } from './cell'
import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'
import type { RedwoodPage } from './page'
import type { RedwoodRouter } from './router'
import type { RedwoodService } from './service/service'
import type { RedwoodSide } from './side'

export class RedwoodProject extends RedwoodIntrospectionComponent {
  readonly type = 'project'

  readonly language: 'typescript' | 'javascript'

  private cells?: RedwoodCell[]
  private pages?: RedwoodPage[]
  private router?: RedwoodRouter
  private services?: RedwoodService[]
  private sides?: RedwoodSide[]

  constructor(rootDirectory: string = getPaths().base) {
    super(rootDirectory)

    // A project is typescript if we detect a tsconfig.json
    const tsconfigFound =
      fs.existsSync(
        path.join(getPaths(this.filepath).web.base, 'tsconfig.json')
      ) ||
      fs.existsSync(
        path.join(getPaths(this.filepath).api.base, 'tsconfig.json')
      )
    this.language = tsconfigFound ? 'typescript' : 'javascript'
  }

  async getErrors(): Promise<RedwoodIntrospectionError[]> {
    const errors: RedwoodIntrospectionError[] = []
    errors.push(...(await this.getCells()).flatMap((cell) => cell.getErrors()))
    return errors
  }

  async getWarnings(): Promise<RedwoodIntrospectionWarning[]> {
    const warnings: RedwoodIntrospectionWarning[] = []
    warnings.push(
      ...(await this.getCells()).flatMap((cell) => cell.getWarnings())
    )
    return warnings
  }

  async getCells(useCache = false): Promise<RedwoodCell[]> {
    if (!useCache || this.cells === undefined) {
      const { RedwoodCell } = await import('./cell')
      this.cells = RedwoodCell.parseCells(
        getPaths(this.filepath).web.components
      )
    }
    return this.cells
  }

  async getPages(useCache = false): Promise<RedwoodPage[]> {
    if (!useCache || this.pages === undefined) {
      const { RedwoodPage } = await import('./page')
      this.pages = RedwoodPage.parsePages(getPaths(this.filepath).web.pages)
    }
    return this.pages
  }

  async getRouter(useCache = false): Promise<RedwoodRouter> {
    if (!useCache || this.router === undefined) {
      const { RedwoodRouter } = await import('./router')
      this.router = RedwoodRouter.parseRouter(
        getPaths(this.filepath).web.routes
      )
    }
    return this.router
  }

  async getServices(useCache = false): Promise<RedwoodService[]> {
    if (!useCache || this.services === undefined) {
      const { RedwoodService } = await import('./service/service')
      this.services = RedwoodService.parseServices(
        getPaths(this.filepath).api.services
      )
    }
    return this.services
  }

  async getSides(useCache = false): Promise<RedwoodSide[]> {
    if (!useCache || this.sides === undefined) {
      const { RedwoodSide } = await import('./side')
      this.sides = RedwoodSide.parseSides(this.filepath)
    }
    return this.sides
  }

  async getComplexity() {
    const routes = (await this.getRouter()).routes
    const routeCount = routes.length
    const prerenderedRouteCount = routes.filter(
      (route) => route.prerender
    ).length
    const serviceCount = (await this.getServices()).length
    const cellCount = (await this.getCells()).length
    const pageCount = (await this.getPages()).length
    return `${routeCount}.${prerenderedRouteCount}.${serviceCount}.${cellCount}.${pageCount}`
  }
}
