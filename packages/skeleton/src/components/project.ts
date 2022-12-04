import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/index'

import { getRootPath } from '../lib/path'

import { RedwoodSkeleton } from './base'
import { extractCells, RedwoodCell } from './cell'
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
      this.routers = extractRouters(this)
      this.layouts = extractLayouts(this)
      this.pages = extractPages(this)
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

  // Diagnostics

  getStatistics(): string {
    throw new Error('Method not implemented.')
  }

  printStatistics(): void {
    throw new Error('Method not implemented.')
  }

  printWarnings(): void {
    throw new Error('Method not implemented.')
  }

  printErrors(): void {
    throw new Error('Method not implemented.')
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
