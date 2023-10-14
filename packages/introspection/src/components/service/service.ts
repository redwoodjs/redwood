import fs from 'node:fs'
import path from 'node:path'

import traverse from '@babel/traverse'

import { getPaths } from '@redwoodjs/project-config'

import { getASTFromFile } from '../../lib/ast'
import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from '../introspection'
import { RedwoodIntrospectionComponent } from '../introspection'

import { RedwoodServiceFunction } from './function'

export class RedwoodService extends RedwoodIntrospectionComponent {
  readonly type = 'service'

  readonly functions: RedwoodServiceFunction[] = []

  private constructor(filepath: string) {
    super(filepath)
    const ast = getASTFromFile(filepath)
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        this.functions.push(
          RedwoodServiceFunction.parseServiceFunction(this.filepath, path.node)
        )
      },
    })
  }

  getErrors(): RedwoodIntrospectionError[] {
    // No errors for services
    return []
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    // No warnings for services
    return []
  }

  static parseService(filepath: string) {
    return new RedwoodService(filepath)
  }

  static parseServices(directory: string = getPaths().api.services) {
    const services: RedwoodService[] = []

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

    const serviceFiles = getServiceFiles(directory)
    serviceFiles.forEach((servicePath) => {
      services.push(this.parseService(servicePath))
    })

    return services
  }
}
