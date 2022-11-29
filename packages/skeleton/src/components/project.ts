import fs from 'fs'
import path from 'path'

import {
  getBaseDir,
  getBaseDirFromFile,
  getPaths,
} from '@redwoodjs/internal/dist/index'

import { getCells, RedwoodCell } from './cell'

enum RedwoodProjectType {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export class RedwoodProject {
  readonly filepath: string
  readonly name: string

  readonly type: RedwoodProjectType

  cells?: RedwoodCell[]

  constructor({ pathWithinProject = '', full = false } = {}) {
    const rootPath = pathWithinProject
      ? getBaseDirFromFile(pathWithinProject)
      : getBaseDir()

    this.filepath = rootPath
    this.name = path.parse(this.filepath).name // TODO: Consider reading the toml config to get the web.title from it?

    // A project is typescript if we detect a tsconfig.json
    this.type =
      fs.existsSync(getPaths(this.filepath).web.base) ||
      fs.existsSync(getPaths(this.filepath).api.base)
        ? RedwoodProjectType.TYPESCRIPT
        : RedwoodProjectType.JAVASCRIPT

    if (full) {
      this.cells = getCells(this)
    }
  }
}

export function printWarnings(project: RedwoodProject) {
  // TODO: Make this prettier
  console.log(
    project.cells?.map((cell) => {
      return cell.filepath, cell.warnings
    })
  )
}

export function printErrors(project: RedwoodProject) {
  // TODO: Make this prettier
  console.log(
    project.cells?.map((cell) => {
      return cell.filepath, cell.errors
    })
  )
}
