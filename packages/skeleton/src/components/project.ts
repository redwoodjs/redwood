import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getPaths } from '@redwoodjs/internal/dist/index'

import { getRootPath } from '../lib/path'

import { RedwoodSkeleton } from './base'
import { extractCells, RedwoodCell } from './cell'
import { extractFunctions, RedwoodFunction } from './function'
import { extractLayouts, RedwoodLayout } from './layout'
import { extractPages, RedwoodPage } from './page'
import { extractRouters, RedwoodRouter } from './router'
import { extractSides, RedwoodSide } from './side'

/**
 * Used to enumerate either JS or TS project types
 */
export enum RedwoodProjectType {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export class RedwoodProject extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly type: RedwoodProjectType

  private sides?: RedwoodSide[] | undefined
  private cells?: RedwoodCell[] | undefined
  private routers?: RedwoodRouter[] | undefined
  private layouts?: RedwoodLayout[] | undefined
  private pages?: RedwoodPage[] | undefined
  private functions?: RedwoodFunction[] | undefined

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
      this.sides = extractSides(this)
      this.cells = extractCells(this)
      this.layouts = extractLayouts(this)
      this.pages = extractPages(this)
      this.functions = extractFunctions(this)
      this.routers = extractRouters(this)
    }
  }

  getSides(forceExtract = false): RedwoodSide[] {
    if (forceExtract) {
      return extractSides(this)
    }
    return this.sides === undefined ? extractSides(this) : this.sides
  }

  getCells(forceExtract = false): RedwoodCell[] {
    if (forceExtract) {
      return extractCells(this)
    }
    return this.cells === undefined ? extractCells(this) : this.cells
  }

  getRouters(forceExtract = false): RedwoodRouter[] {
    if (forceExtract) {
      return extractRouters(this)
    }
    return this.routers === undefined ? extractRouters(this) : this.routers
  }

  getLayouts(forceExtract = false): RedwoodLayout[] {
    if (forceExtract) {
      return extractLayouts(this)
    }
    return this.layouts === undefined ? extractLayouts(this) : this.layouts
  }

  getPages(forceExtract = false): RedwoodPage[] {
    if (forceExtract) {
      return extractPages(this)
    }
    return this.pages === undefined ? extractPages(this) : this.pages
  }

  getFunctions(forceExtract = false): RedwoodFunction[] {
    if (forceExtract) {
      return extractFunctions(this)
    }
    return this.functions === undefined
      ? extractFunctions(this)
      : this.functions
  }

  // Diagnostics

  getInformation(): string {
    return '' // TODO: Implement, gets the info of all other components too
  }

  printInformation(): void {
    console.log(
      `${chalk.bgCyan('[Info]')}\t${this.name}\t${chalk.dim(this.filepath)}`
    )
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
      this.sides?.forEach((side) => {
        side.printWarnings()
      })
    }
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
      this.sides?.forEach((side) => {
        side.printErrors()
      })
    }
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
