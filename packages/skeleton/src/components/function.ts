import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'
import type { ExportNamedDeclaration } from '@babel/types'
import {
  isVariableDeclaration,
  isVariableDeclarator,
  isIdentifier,
} from '@babel/types'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getASTFromFile } from '../lib/ast'

import { RedwoodSkeleton } from './base'
import type { RedwoodProject } from './project'

export class RedwoodFunction extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  constructor(filepath: string) {
    super(filepath)

    const ast = getASTFromFile(this.filepath)
    const namedExports: ExportNamedDeclaration[] = []
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        namedExports.push(path.node)
      },
    })
    const handlerExport = namedExports.find((node) => {
      return (
        isVariableDeclaration(node.declaration) &&
        isVariableDeclarator(node.declaration.declarations[0]) &&
        isIdentifier(node.declaration.declarations[0].id) &&
        node.declaration.declarations[0].id.name === 'handler'
      )
    })
    if (handlerExport === undefined) {
      this.errors.push('No "handler" export found')
    }
  }

  getInformation(): string {
    return '' // I don't think there is any useful information about the function, so return an empty string
  }
}

export function extractFunction(filepath: string): RedwoodFunction {
  return new RedwoodFunction(filepath)
}

export function extractFunctions(
  project: RedwoodProject | undefined = undefined
): RedwoodFunction[] {
  const functions: RedwoodFunction[] = []

  const functionsPath = project
    ? getPaths(project.filepath).api.functions
    : getPaths().api.functions

  if (!fs.existsSync(functionsPath)) {
    return functions
  }

  // TODO: Confirm this the condition to detect a function
  // Functions must be defined within the functions directory (at the top level?)
  const getFunctionFiles = (directory: string) => {
    const functionFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isFile()) {
        functionFiles.push(path.join(directory, content))
      }
    })
    return functionFiles
  }

  const layoutFiles = getFunctionFiles(functionsPath)
  layoutFiles.forEach((layoutPath) => {
    functions.push(extractFunction(layoutPath))
  })

  return functions
}
