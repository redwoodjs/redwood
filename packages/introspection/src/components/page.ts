import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'

import { getPaths } from '@redwoodjs/project-config'

import { getASTFromFile } from '../lib/ast'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'

export class RedwoodPage extends RedwoodIntrospectionComponent {
  readonly type = 'page'

  readonly hasDefaultExport: boolean

  private constructor(filepath: string) {
    super(filepath)

    const ast = getASTFromFile(this.filepath)

    // Check if there is a default export
    let hasDefaultExport = false
    traverse(ast, {
      ExportDefaultDeclaration: () => {
        hasDefaultExport = true
      },
    })
    this.hasDefaultExport = hasDefaultExport
  }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = []

    // Ensure that there is a default export
    if (!this.hasDefaultExport) {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No default export found',
      })
    }

    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    // No warnings for pages
    return []
  }

  static parsePage(filepath: string) {
    return new RedwoodPage(filepath)
  }

  static parsePages(directory: string = getPaths().web.pages) {
    const pages: RedwoodPage[] = []

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

    const pageFiles = getPageFiles(directory)
    pageFiles.forEach((pagePath) => {
      pages.push(this.parsePage(pagePath))
    })

    return pages
  }
}
