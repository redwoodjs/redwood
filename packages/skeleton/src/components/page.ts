import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodSkeleton } from './base'
import { RedwoodLayout } from './layout'
import { RedwoodProject } from './project'
import { RedwoodRoute } from './route'

export class RedwoodPage extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  constructor(filepath: string) {
    // We want the name to be the same name that would be used within the Router.tsx
    const pagesPath = getPaths(
      RedwoodProject.getProject({ pathWithinProject: filepath }).filepath
    ).web.pages
    const pageDiffPath = filepath.substring(pagesPath.length)
    const name = pageDiffPath
      .substring(0, pageDiffPath.lastIndexOf(path.sep)) // TODO: Do we need the path.sep here?
      .split(path.sep) // TODO: Do we need the path.sep here?
      .join('')

    super(filepath, name)
  }

  getRoutes(): RedwoodRoute[] {
    throw new Error('Method not implemented.')
  }

  getLayouts(): RedwoodLayout[] {
    throw new Error('Method not implemented.')
  }

  getInformation(): string {
    return '' // TODO: Implement
  }
}

export function extractPage(filepath: string): RedwoodPage {
  return new RedwoodPage(filepath)
}

export function extractPages(
  project: RedwoodProject | undefined = undefined
): RedwoodPage[] {
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
