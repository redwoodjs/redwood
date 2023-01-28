import fs from 'fs'
import path from 'path'

import traverse from '@babel/traverse'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getASTFromFile } from '../../lib/ast'
import type { RedwoodProject } from '../project'
import { RedwoodSkeleton } from '../skeleton'

import { RedwoodServiceFunction } from './function'

export class RedwoodService extends RedwoodSkeleton {
  readonly functions: RedwoodServiceFunction[] = []

  constructor(filepath: string) {
    super(filepath)
    const ast = getASTFromFile(filepath)
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        this.functions.push(
          new RedwoodServiceFunction(this.filepath, path.node)
        )
      },
    })
  }

  executeAdditionalChecks() {
    this.functions.forEach((func) => {
      func.executeAdditionalChecks()
    })
  }
}

export function extractService(filepath: string) {
  return new RedwoodService(filepath)
}

export function extractServices(project?: RedwoodProject) {
  const services: RedwoodService[] = []

  const servicesPath = project
    ? getPaths(project.filepath).api.services
    : getPaths().api.services

  if (!fs.existsSync(servicesPath)) {
    return services
  }

  // TODO: Confirm this is the condition to detect a service
  const getServiceFiles = (directory: string) => {
    const serviceFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isDirectory()) {
        serviceFiles.push(...getServiceFiles(path.join(directory, content)))
      } else if (stat.isFile()) {
        if (
          content.match(/.+\.(js|ts)$/) &&
          !content.match(/.+\.(test\.js|test\.ts)$/) &&
          !content.match(/.+\.(scenarios\.js|scenarios\.ts)$/)
        ) {
          serviceFiles.push(path.join(directory, content))
        }
      }
    })
    return serviceFiles
  }

  const serviceFiles = getServiceFiles(servicesPath)
  serviceFiles.forEach((servicePath) => {
    services.push(extractService(servicePath))
  })

  return services
}
