import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getRootPath } from '../lib/path'

import { RedwoodProject } from './project'
import type { RedwoodRoute } from './route'
import { RedwoodSkeleton } from './skeleton'

export class RedwoodPage extends RedwoodSkeleton {
  constructor(filepath: string) {
    const pagesPath = getPaths(getRootPath(filepath)).web.pages
    const name = filepath
      .substring(pagesPath.length, filepath.lastIndexOf(path.sep))
      .replaceAll(path.sep, '')
    super(filepath, name)
  }

  getRoutes() {
    const routes: RedwoodRoute[] = []
    RedwoodProject.getProject({
      pathWithinProject: this.filepath,
      readFromCache: true,
    })
      .getRouters()
      .forEach((router) => {
        routes.push(
          ...router.routes.filter((route) => {
            return route.pageIdentifier === this.name
          })
        )
      })
    return routes
  }
}

export function extractPage(filepath: string) {
  return new RedwoodPage(filepath)
}

export function extractPages(project?: RedwoodProject) {
  const pages: RedwoodPage[] = []

  const pagesPath = project
    ? getPaths(project.filepath).web.pages
    : getPaths().web.pages

  if (!fs.existsSync(pagesPath)) {
    return pages
  }

  // TODO: Confirm this the condition to detect a page
  // Pages must be defined within a file which ends with `Page.{js, jsx, tsx}`
  const getPageFiles = (directory: string) => {
    const pageFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isDirectory()) {
        pageFiles.push(...getPageFiles(path.join(directory, content)))
      } else if (stat.isFile()) {
        if (content.match(/.+Page\.(js|jsx|tsx)$/)) {
          pageFiles.push(path.join(directory, content))
        }
      }
    })
    return pageFiles
  }

  const pageFiles = getPageFiles(pagesPath)
  pageFiles.forEach((pagePath) => {
    pages.push(extractPage(pagePath))
  })

  return pages
}
