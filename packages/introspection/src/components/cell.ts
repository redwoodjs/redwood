import fs from 'node:fs'
import path from 'node:path'

import traverse from '@babel/traverse'
import type { ExportNamedDeclaration } from '@babel/types'
import {
  isVariableDeclaration,
  isVariableDeclarator,
  isTaggedTemplateExpression,
  isIdentifier,
} from '@babel/types'

import { getPaths } from '@redwoodjs/project-config'

import { getASTFromFile } from '../lib/ast'
import { getGraphQLQueryName } from '../lib/gql'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'

export class RedwoodCell extends RedwoodIntrospectionComponent {
  readonly type = 'cell'

  readonly gqlQuery: string | undefined
  readonly gqlQueryName: string | undefined

  readonly hasQueryExport: boolean
  readonly hasBeforeQueryExport: boolean
  readonly hasIsEmptyExport: boolean
  readonly hasAfterQueryExport: boolean
  readonly hasLoadingExport: boolean
  readonly hasEmptyExport: boolean
  readonly hasFailureExport: boolean
  readonly hasSuccessExport: boolean

  readonly isValid: boolean

  private constructor(filepath: string) {
    super(filepath)

    const ast = getASTFromFile(this.filepath)

    const namedExports: ExportNamedDeclaration[] = []
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        namedExports.push(path.node)
      },
    })

    const namedExportsNames = namedExports
      .map((node) => {
        if (
          isVariableDeclaration(node.declaration) &&
          isVariableDeclarator(node.declaration.declarations[0]) &&
          isIdentifier(node.declaration.declarations[0].id)
        ) {
          return node.declaration.declarations[0].id.name
        }
        return false
      })
      .filter(Boolean)

    // Check for a cells expected export fields
    this.hasQueryExport = namedExportsNames.includes('QUERY')
    this.hasBeforeQueryExport = namedExportsNames.includes('beforeQuery')
    this.hasIsEmptyExport = namedExportsNames.includes('isEmpty')
    this.hasAfterQueryExport = namedExportsNames.includes('afterQuery')
    this.hasLoadingExport = namedExportsNames.includes('Loading')
    this.hasEmptyExport = namedExportsNames.includes('Empty')
    this.hasFailureExport = namedExportsNames.includes('Failure')
    this.hasSuccessExport = namedExportsNames.includes('Success')

    const queryExport = namedExports.find((node) => {
      if (
        node.declaration != null &&
        isVariableDeclaration(node.declaration) &&
        isVariableDeclarator(node.declaration.declarations[0]) &&
        isIdentifier(node.declaration.declarations[0].id)
      ) {
        return node.declaration.declarations[0].id.name === 'QUERY'
      }
      return false
    })

    if (
      queryExport !== undefined &&
      queryExport.declaration != null &&
      isVariableDeclaration(queryExport.declaration) &&
      isVariableDeclarator(queryExport.declaration.declarations[0]) &&
      queryExport.declaration.declarations[0].init != null &&
      isTaggedTemplateExpression(
        queryExport.declaration.declarations[0].init
      ) &&
      isIdentifier(queryExport.declaration.declarations[0].init.tag) &&
      queryExport.declaration.declarations[0].init.tag.name === 'gql'
    ) {
      this.gqlQuery =
        queryExport.declaration.declarations[0].init.quasi.quasis[0].value.raw
      this.gqlQueryName = getGraphQLQueryName(this.gqlQuery)
    }

    // Determine if the cell is valid
    this.isValid = this.getErrors().length === 0
  }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = []

    // Check if the mandatory success export is present
    if (!this.hasSuccessExport) {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No "Success" export found but one is required',
      })
    }

    // Check if the mandatory query export is present
    if (!this.hasQueryExport) {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'No "QUERY" export found but one is required',
      })
    }

    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    const warnings: RedwoodIntrospectionWarning[] = []

    // Check if the cell query could be extracted
    if (this.gqlQuery === undefined) {
      warnings.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'Unable to extract your cell query',
      })
    }

    // Check if the cell query is named
    if (this.gqlQueryName === undefined) {
      warnings.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'We recommend that you name your query operation',
      })
    }

    return warnings
  }

  static parseCell(filepath: string) {
    return new RedwoodCell(filepath)
  }

  static parseCells(directory: string = getPaths().web.components) {
    const cells: RedwoodCell[] = []

    // TODO: Confirm this the condition to detect a cell
    // Cells must be defined within a file which ends with `Cell.{js, jsx, tsx}`
    const getCellFiles = (directory: string) => {
      const cellFiles: string[] = []

      const directoryContents = fs.readdirSync(directory)
      directoryContents.forEach((content) => {
        const stat = fs.lstatSync(path.join(directory, content))
        if (stat.isDirectory()) {
          cellFiles.push(...getCellFiles(path.join(directory, content)))
        } else if (stat.isFile()) {
          if (content.match(/.+Cell\.(js|jsx|tsx)$/)) {
            cellFiles.push(path.join(directory, content))
          }
        }
      })

      return cellFiles
    }

    const cellFiles = getCellFiles(directory)
    cellFiles.forEach((cellPath) => {
      cells.push(this.parseCell(cellPath))
    })

    return cells
  }
}
