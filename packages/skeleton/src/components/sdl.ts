import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'
import {
  ExportNamedDeclaration,
  isIdentifier,
  isTemplateElement,
  isVariableDeclaration,
  isVariableDeclarator,
  VariableDeclarator,
} from '@babel/types'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getASTFromFile } from '../lib/ast'

import { RedwoodSkeleton } from './base'
import type { RedwoodProject } from './project'

export class RedwoodSDL extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly gql: string | undefined

  constructor(filepath: string) {
    super(filepath)

    const ast = getASTFromFile(this.filepath)
    const namedExports: ExportNamedDeclaration[] = []
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        namedExports.push(path.node)
      },
    })

    let schemaExportVariableDeclarator: VariableDeclarator | undefined
    namedExports.forEach((namedExport) => {
      if (
        namedExport.declaration != null &&
        isVariableDeclaration(namedExport.declaration) &&
        isVariableDeclarator(namedExport.declaration.declarations[0]) &&
        isIdentifier(namedExport.declaration.declarations[0].id) &&
        namedExport.declaration.declarations[0].id.name === 'schema'
      ) {
        schemaExportVariableDeclarator = namedExport.declaration.declarations[0]
      }
    })
    if (schemaExportVariableDeclarator === undefined) {
      this.errors.push("No 'schema' export could be found")
    } else {
      switch (schemaExportVariableDeclarator.init?.type) {
        case 'TaggedTemplateExpression':
          if (
            schemaExportVariableDeclarator.init.quasi.quasis[0] !== undefined &&
            isTemplateElement(
              schemaExportVariableDeclarator.init.quasi.quasis[0]
            )
          ) {
            this.gql =
              schemaExportVariableDeclarator.init.quasi.quasis[0].value.cooked
          }
          break

        default:
          this.warnings.push(
            `Unable to extract the gql (${schemaExportVariableDeclarator.init?.type})`
          )
          break
      }
    }
    if (this.gql === undefined) {
      this.warnings.push('Could not extract the gql')
    }

    // TODO: Process the gql
  }
}

export function extractSDL(filepath: string): RedwoodSDL {
  return new RedwoodSDL(filepath)
}

export function extractSDLs(
  project: RedwoodProject | undefined = undefined
): RedwoodSDL[] {
  const sdls: RedwoodSDL[] = []

  const sdlPath = project
    ? getPaths(project.filepath).api.graphql
    : getPaths().api.graphql

  // TODO: Confirm this the condition to detect a sdl
  // SDLs must be defined within the graphql directory (at the top level?)
  const getSDLFiles = (directory: string) => {
    const SDLFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isFile()) {
        SDLFiles.push(path.join(directory, content))
      }
    })
    return SDLFiles
  }

  const sdlFiles = getSDLFiles(sdlPath)
  sdlFiles.forEach((sdlPath) => {
    if (!sdlPath.endsWith('.keep')) {
      sdls.push(extractSDL(sdlPath))
    }
  })

  return sdls
}
