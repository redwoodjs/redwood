import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

// import { getASTFromFile } from '../lib/ast'

import { RedwoodError, RedwoodWarning } from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export class RedwoodService extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  constructor(filepath: string) {
    super(filepath)

    // const _ = getASTFromFile(filepath)

    // TODO: Extract all functions
    // TODO: Extract all function parameters

    // Checks

    // TODO: Check service has corresponding SDL
    // TODO: Check function parameters match corresponding query or mutation parameters
  }
}

export function extractService(filepath: string): RedwoodService {
  return new RedwoodService(filepath)
}

export function extractServices(
  project: RedwoodProject | undefined = undefined
): RedwoodService[] {
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
