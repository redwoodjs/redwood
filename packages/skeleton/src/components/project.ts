import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getPaths } from '@redwoodjs/internal/dist/index'

import { getRootPath } from '../lib/path'

import { extractCells } from './cell'
import type { RedwoodCell } from './cell'
import { RedwoodError, RedwoodWarning } from './diagnostic'
import { extractDirectives } from './directive'
import type { RedwoodDirective } from './directive'
import { extractFunctions } from './function'
import type { RedwoodFunction } from './function'
import { extractLayouts } from './layout'
import type { RedwoodLayout } from './layout'
import { extractPages } from './page'
import type { RedwoodPage } from './page'
import { extractRouters } from './router'
import type { RedwoodRouter } from './router'
import { extractSDLs } from './sdl/sdl'
import type { RedwoodSDL } from './sdl/sdl'
import { extractServices } from './service/service'
import type { RedwoodService } from './service/service'
import { extractSides } from './side'
import type { RedwoodSide } from './side'
import { RedwoodSkeleton } from './skeleton'
import { extractTOMLs } from './toml'
import type { RedwoodTOML } from './toml'

/**
 * Used to enumerate either JS or TS project types
 */
export enum RedwoodProjectType {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export class RedwoodProject extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  readonly type: RedwoodProjectType

  private cells?: RedwoodCell[] | undefined
  private directives?: RedwoodDirective[] | undefined
  private functions?: RedwoodFunction[] | undefined
  private layouts?: RedwoodLayout[] | undefined
  private pages?: RedwoodPage[] | undefined
  private routers?: RedwoodRouter[] | undefined
  private sdls?: RedwoodSDL[] | undefined
  private services?: RedwoodService[] | undefined
  private sides?: RedwoodSide[] | undefined
  private tomls?: RedwoodTOML[] | undefined

  public static getProject({
    pathWithinProject = '',
    full = false,
    readFromCache = true,
    insertIntoCache = true,
  }: {
    pathWithinProject?: string
    full?: boolean
    readFromCache?: boolean
    insertIntoCache?: boolean
  } = {}) {
    const projectCache = RedwoodProjectsCache.getInstance().projects
    const rootPath = getRootPath(pathWithinProject)
    if (readFromCache) {
      const cachedProject = projectCache.get(rootPath)
      if (cachedProject) {
        return cachedProject
      }
    }
    const project = new RedwoodProject(rootPath, full)
    if (insertIntoCache) {
      projectCache.set(project.filepath, project)
    }
    return project
  }

  private constructor(rootPath: string, full = false) {
    super(rootPath)

    // A project is typescript if we detect a tsconfig.json
    this.type =
      fs.existsSync(
        path.join(getPaths(this.filepath).web.base, 'tsconfig.json')
      ) ||
      fs.existsSync(
        path.join(getPaths(this.filepath).api.base, 'tsconfig.json')
      )
        ? RedwoodProjectType.TYPESCRIPT
        : RedwoodProjectType.JAVASCRIPT

    if (full) {
      this.cells = extractCells(this)
      this.directives = extractDirectives(this)
      this.functions = extractFunctions(this)
      this.layouts = extractLayouts(this)
      this.pages = extractPages(this)
      this.routers = extractRouters(this)
      this.sdls = extractSDLs(this)
      this.services = extractServices(this)
      this.sides = extractSides(this)
      this.tomls = extractTOMLs(this)

      // Execute the additional checks since we've already extracted all components
      this.executeAdditionalChecks()
    }
  }

  executeAdditionalChecks(): void {
    this.cells?.forEach((cell) => {
      cell.executeAdditionalChecks()
    })
    this.directives?.forEach((directive) => {
      directive.executeAdditionalChecks()
    })
    this.functions?.forEach((func) => {
      func.executeAdditionalChecks()
    })
    this.layouts?.forEach((layout) => {
      layout.executeAdditionalChecks()
    })
    this.pages?.forEach((page) => {
      page.executeAdditionalChecks()
    })
    this.routers?.forEach((router) => {
      router.executeAdditionalChecks()
      router.routes.forEach((route) => {
        route.executeAdditionalChecks()
      })
    })
    this.sdls?.forEach((sdl) => {
      sdl.executeAdditionalChecks()
      sdl.queries?.forEach((query) => {
        query.executeAdditionalChecks()
      })
      sdl.mutations?.forEach((mutation) => {
        mutation.executeAdditionalChecks()
      })
    })
    this.services?.forEach((service) => {
      service.executeAdditionalChecks()
    })
    this.sides?.forEach((side) => {
      side.executeAdditionalChecks()
    })
    this.tomls?.forEach((toml) => {
      toml.executeAdditionalChecks()
    })
  }

  getTOMLs(forceExtract = false): RedwoodTOML[] {
    if (forceExtract || this.tomls === undefined) {
      this.tomls = extractTOMLs(this)
    }
    return this.tomls
  }

  getSDLs(forceExtract = false): RedwoodSDL[] {
    if (forceExtract || this.sdls === undefined) {
      this.sdls = extractSDLs(this)
    }
    return this.sdls
  }

  getServices(forceExtract = false): RedwoodService[] {
    if (forceExtract || this.services === undefined) {
      this.services = extractServices(this)
    }
    return this.services
  }

  getSides(forceExtract = false): RedwoodSide[] {
    if (forceExtract || this.sides === undefined) {
      this.sides = extractSides(this)
    }
    return this.sides
  }

  getCells(forceExtract = false): RedwoodCell[] {
    if (forceExtract || this.cells === undefined) {
      this.cells = extractCells(this)
    }
    return this.cells
  }

  getRouters(forceExtract = false): RedwoodRouter[] {
    if (forceExtract || this.routers === undefined) {
      this.routers = extractRouters(this)
    }
    return this.routers
  }

  getLayouts(forceExtract = false): RedwoodLayout[] {
    if (forceExtract || this.layouts === undefined) {
      this.layouts = extractLayouts(this)
    }
    return this.layouts
  }

  getPages(forceExtract = false): RedwoodPage[] {
    if (forceExtract || this.pages === undefined) {
      this.pages = extractPages(this)
    }
    return this.pages
  }

  getFunctions(forceExtract = false): RedwoodFunction[] {
    if (forceExtract || this.functions === undefined) {
      this.functions = extractFunctions(this)
    }
    return this.functions
  }

  getDirectives(forceExtract = false): RedwoodDirective[] {
    if (forceExtract || this.directives === undefined) {
      this.directives = extractDirectives(this)
    }
    return this.directives
  }

  hasWarnings(cascade = false): boolean {
    let warningsFound = this.warnings.length > 0
    // if project has warnings then we can skip checking children and just return
    if (cascade && !warningsFound) {
      this.cells?.forEach((cell) => {
        warningsFound ||= cell.hasWarnings()
      })
      this.directives?.forEach((directive) => {
        warningsFound ||= directive.hasWarnings()
      })
      this.functions?.forEach((func) => {
        warningsFound ||= func.hasWarnings()
      })
      this.layouts?.forEach((layout) => {
        warningsFound ||= layout.hasWarnings()
      })
      this.pages?.forEach((page) => {
        warningsFound ||= page.hasWarnings()
      })
      this.routers?.forEach((router) => {
        warningsFound ||= router.hasWarnings()
        router.routes.forEach((route) => {
          warningsFound ||= route.hasWarnings()
        })
      })
      this.sdls?.forEach((sdl) => {
        warningsFound ||= sdl.hasWarnings()
        sdl.queries?.forEach((query) => {
          warningsFound ||= query.hasWarnings()
        })
        sdl.mutations?.forEach((mutation) => {
          warningsFound ||= mutation.hasWarnings()
        })
      })
      this.services?.forEach((service) => {
        warningsFound ||= service.hasWarnings()
      })
      this.sides?.forEach((side) => {
        warningsFound ||= side.hasWarnings()
      })
      this.tomls?.forEach((toml) => {
        warningsFound ||= toml.hasWarnings()
      })
    }
    return warningsFound
  }

  printWarnings(cascade = false): void {
    if (this.warnings.length > 0) {
      const titleLine = `${chalk.bgYellow('[Warn]')}\t${this.name} ${chalk.dim(
        this.filepath
      )}`
      const warningLines = this.warnings.map((warning, index) => {
        return ` (${index + 1}) ${warning}\n`
      })
      console.log(titleLine.concat('\n', ...warningLines).trimEnd())
    }
    if (cascade) {
      this.cells?.forEach((cell) => {
        cell.printWarnings()
      })
      this.directives?.forEach((directive) => {
        directive.printWarnings()
      })
      this.functions?.forEach((func) => {
        func.printWarnings()
      })
      this.layouts?.forEach((layout) => {
        layout.printWarnings()
      })
      this.pages?.forEach((page) => {
        page.printWarnings()
      })
      this.routers?.forEach((router) => {
        router.printWarnings()
        router.routes.forEach((route) => {
          route.printWarnings()
        })
      })
      this.sdls?.forEach((sdl) => {
        sdl.printWarnings()
        sdl.queries?.forEach((query) => {
          query.printWarnings()
        })
        sdl.mutations?.forEach((mutation) => {
          mutation.printWarnings()
        })
      })
      this.services?.forEach((service) => {
        service.printWarnings()
      })
      this.sides?.forEach((side) => {
        side.printWarnings()
      })
      this.tomls?.forEach((toml) => {
        toml.printWarnings()
      })
    }
  }

  hasErrors(cascade = false): boolean {
    let errorsFound = this.errors.length > 0
    // if project has errors then we can skip checking children and just return
    if (cascade && !errorsFound) {
      this.cells?.forEach((cell) => {
        errorsFound ||= cell.hasErrors()
      })
      this.directives?.forEach((directive) => {
        errorsFound ||= directive.hasErrors()
      })
      this.functions?.forEach((func) => {
        errorsFound ||= func.hasErrors()
      })
      this.layouts?.forEach((layout) => {
        errorsFound ||= layout.hasErrors()
      })
      this.pages?.forEach((page) => {
        errorsFound ||= page.hasErrors()
      })
      this.routers?.forEach((router) => {
        errorsFound ||= router.hasErrors()
        router.routes.forEach((route) => {
          errorsFound ||= route.hasErrors()
        })
      })
      this.sdls?.forEach((sdl) => {
        errorsFound ||= sdl.hasErrors()
        sdl.queries?.forEach((query) => {
          errorsFound ||= query.hasErrors()
        })
        sdl.mutations?.forEach((mutation) => {
          errorsFound ||= mutation.hasErrors()
        })
      })
      this.services?.forEach((service) => {
        errorsFound ||= service.hasErrors()
      })
      this.sides?.forEach((side) => {
        errorsFound ||= side.hasErrors()
      })
      this.tomls?.forEach((toml) => {
        errorsFound ||= toml.hasErrors()
      })
    }
    return errorsFound
  }

  printErrors(cascade = false): void {
    if (this.errors.length > 0) {
      const titleLine = `${chalk.bgRed('[Error]')}\t${this.name} ${chalk.dim(
        this.filepath
      )}`
      const errorLines = this.errors.map((error, index) => {
        return ` (${index + 1}) ${error}\n`
      })
      console.log(titleLine.concat('\n', ...errorLines).trimEnd())
    }
    if (cascade) {
      this.cells?.forEach((cell) => {
        cell.printErrors()
      })
      this.directives?.forEach((directive) => {
        directive.printErrors()
      })
      this.functions?.forEach((func) => {
        func.printErrors()
      })
      this.layouts?.forEach((layout) => {
        layout.printErrors()
      })
      this.pages?.forEach((page) => {
        page.printErrors()
      })
      this.routers?.forEach((router) => {
        router.printErrors()
        router.routes.forEach((route) => {
          route.printErrors()
        })
      })
      this.sdls?.forEach((sdl) => {
        sdl.printErrors()
        sdl.queries?.forEach((query) => {
          query.printErrors()
        })
        sdl.mutations?.forEach((mutation) => {
          mutation.printErrors()
        })
      })
      this.services?.forEach((service) => {
        service.printErrors()
      })
      this.sides?.forEach((side) => {
        side.printErrors()
      })
      this.tomls?.forEach((toml) => {
        toml.printErrors()
      })
    }
  }

  getComplexity() {
    const totalRoutes =
      this.getRouters()?.reduce((_: number, val: RedwoodRouter) => {
        return val.routes.length
      }, 0) || 0
    const totalServices = this.getServices()?.length || 0
    const totalCells = this.getCells()?.length || 0
    const totalPages = this.getPages()?.length || 0
    return `${totalRoutes}.${totalServices}.${totalCells}.${totalPages}`
  }
}

/**
 * Singelton class which contains a cache of {@link RedwoodProject} instances.
 *
 * This class is not exported and should only be available from static methods within {@link RedwoodProject}, in order to keep the surface of the skeleton API cleaner and leaner.
 */
class RedwoodProjectsCache {
  private static instance: RedwoodProjectsCache

  public projects: Map<string, RedwoodProject>

  private constructor() {
    this.projects = new Map()
  }

  public static getInstance(): RedwoodProjectsCache {
    if (!RedwoodProjectsCache.instance) {
      RedwoodProjectsCache.instance = new RedwoodProjectsCache()
    }
    return RedwoodProjectsCache.instance
  }
}
