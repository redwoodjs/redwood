import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'
import {
  isVariableDeclaration,
  isVariableDeclarator,
  isIdentifier,
  ExportNamedDeclaration,
} from '@babel/types'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getASTFromCode } from '../lib/ast'
import { getGraphQLQueryName } from '../lib/gql'

import {
  RedwoodError,
  RedwoodErrorCode,
  RedwoodWarning,
  RedwoodWarningCode,
} from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export class RedwoodCell extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

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

  constructor(filepath: string) {
    super(filepath)

    // TODO: Just get the gql from the ast not from the source code string
    const code = fs.readFileSync(this.filepath, { encoding: 'utf8', flag: 'r' })
    const ast = getASTFromCode(code)

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

    // Check if the mandatory success export is present
    if (!this.hasSuccessExport) {
      this.errors.push({
        code: RedwoodErrorCode.CELL_NO_SUCCESS_EXPORT,
        message: 'No "Success" export found but one is required',
      })
    }

    // Check if the mandatory query export is present
    if (!this.hasQueryExport) {
      this.errors.push({
        code: RedwoodErrorCode.CELL_NO_QUERY_EXPORT,
        message: 'No "QUERY" export found but one is required',
      })
    } else {
      const graphqlExport = namedExports.find((node) => {
        if (
          node.declaration != null &&
          isVariableDeclaration(node.declaration) &&
          isVariableDeclarator(node.declaration.declarations[0]) &&
          isIdentifier(node.declaration.declarations[0].id)
        ) {
          return node.declaration.declarations[0].id.name === 'QUERY'
        }
        return false
      }) as ExportNamedDeclaration // Note: This should not be undefined given this.hasQueryExport == true

      if (
        graphqlExport.declaration != null &&
        isVariableDeclaration(graphqlExport.declaration) &&
        isVariableDeclarator(graphqlExport.declaration.declarations[0]) &&
        graphqlExport.declaration.declarations[0].init != null
      ) {
        const gqlVariable = graphqlExport.declaration.declarations[0].init
        switch (gqlVariable.type) {
          case 'TaggedTemplateExpression':
            if (gqlVariable.quasi.start && gqlVariable.quasi.end) {
              const graphQLSource = code.substring(
                gqlVariable.quasi.start + 1,
                gqlVariable.quasi.end - 1
              )
              this.gqlQuery = graphQLSource
              this.gqlQueryName = getGraphQLQueryName(this.gqlQuery)
              if (this.gqlQueryName === undefined) {
                this.warnings.push({
                  code: RedwoodWarningCode.CELL_NO_QUERY_OPERATION_NAME,
                  message: 'We recommend that you name your query operation',
                })
              }
            } else {
              this.errors.push({
                code: RedwoodErrorCode.GENERIC_PARSER_ERROR_JSTS,
                message: `Could not extract the GraphQL query from "${gqlVariable.type}"`,
              })
            }
            break
          default:
            this.errors.push({
              code: RedwoodErrorCode.GENERIC_PARSER_ERROR_JSTS,
              message: `Could not process the GraphQL query from "${gqlVariable.type}"`,
            })
            break
        }
      } else {
        this.errors.push({
          code: RedwoodErrorCode.GENERIC_PARSER_ERROR_JSTS,
          message: 'Could not process the GraphQL variable',
        })
      }
    }

    // Determine if the cell is valid
    this.isValid = this.hasQueryExport && this.hasSuccessExport
  }
}

export function extractCell(filepath: string): RedwoodCell {
  return new RedwoodCell(filepath)
}

export function extractCells(
  project: RedwoodProject | undefined = undefined
): RedwoodCell[] {
  const cells: RedwoodCell[] = []

  const componentsPath = project
    ? getPaths(project.filepath).web.components
    : getPaths().web.components

  if (!fs.existsSync(componentsPath)) {
    return cells
  }

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

  const cellFiles = getCellFiles(componentsPath)
  cellFiles.forEach((cellPath) => {
    cells.push(extractCell(cellPath))
  })

  return cells
}
