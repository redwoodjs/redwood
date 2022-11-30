import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getNamedExports, getProgramFromCode } from '../lib/ast'
import { getGraphQLQueryName } from '../lib/gql'

import { RedwoodSkeleton } from './base'
import type { RedwoodProject } from './project'

export class RedwoodCell extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly hasQueryExport: boolean

  readonly gqlQuery: string | undefined
  readonly gqlQueryName: string | undefined

  readonly hasLoadingExport: boolean
  readonly hasEmptyExport: boolean
  readonly hasFailureExport: boolean
  readonly hasSuccessExport: boolean

  readonly isValid: boolean

  constructor(filepath: string) {
    super(filepath)

    const code = fs.readFileSync(this.filepath, { encoding: 'utf8', flag: 'r' })
    const ast = getProgramFromCode(code)

    const namedExports = getNamedExports(ast)
    const namedExportsNames = namedExports
      .map((node) => {
        if (
          node.declaration == null ||
          node.declaration.type !== 'VariableDeclaration'
        ) {
          return false
        }
        if (node.declaration.declarations[0].id.type === 'Identifier') {
          return node.declaration.declarations[0].id.name
        }
        return false
      })
      .filter(Boolean)

    // Check for a cells expected export fields
    this.hasQueryExport = namedExportsNames.includes('QUERY')
    this.hasLoadingExport = namedExportsNames.includes('Loading')
    this.hasEmptyExport = namedExportsNames.includes('Empty')
    this.hasFailureExport = namedExportsNames.includes('Failure')
    this.hasSuccessExport = namedExportsNames.includes('Success')

    // Check if the mandatory success export is present
    if (!this.hasSuccessExport) {
      this.errors.push('No "Success" export found but one is required')
    }

    // Check if the mandatory query export is present
    if (!this.hasQueryExport) {
      this.errors.push('No "QUERY" export found but one is required')
    } else {
      const graphqlExport = namedExports.filter((node) => {
        if (
          node.declaration == null ||
          node.declaration.type !== 'VariableDeclaration'
        ) {
          return false
        }
        if (node.declaration.declarations[0].id.type === 'Identifier') {
          return node.declaration.declarations[0].id.name === 'QUERY'
        }
        return false
      })[0]
      // Note: [0] should exist since this.hasQueryExport

      if (
        graphqlExport.declaration &&
        graphqlExport.declaration.type === 'VariableDeclaration'
      ) {
        const gqlVariable = graphqlExport.declaration.declarations[0].init
        switch (gqlVariable?.type) {
          case 'TaggedTemplateExpression':
            if (gqlVariable.quasi.start && gqlVariable.quasi.end) {
              const graphQLSource = code.substring(
                gqlVariable.quasi.start + 1,
                gqlVariable.quasi.end - 1
              )
              this.gqlQuery = graphQLSource
              this.gqlQueryName = getGraphQLQueryName(this.gqlQuery)
              if (this.gqlQueryName === undefined) {
                this.errors.push('Could not determine the GraphQL query name')
              }
            } else {
              this.errors.push(
                `Could not extract the GraphQL query from "${gqlVariable?.type}"`
              )
            }
            break
          default:
            this.errors.push(
              `Could not process the GraphQL query from "${gqlVariable?.type}"`
            )
            break
        }
      } else {
        this.errors.push('Could not process the GraphQL variable')
      }
    }

    // Determine if the cell is valid
    this.isValid = this.hasQueryExport && this.hasSuccessExport
  }

  // Diagnostics

  getStatistics(): string {
    throw new Error('Method not implemented.')
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
