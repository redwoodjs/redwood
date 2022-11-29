import path from 'path'

import { getBaseDir, getBaseDirFromFile } from '@redwoodjs/internal/dist/index'

import { getCells, RedwoodCell } from './cell'

export class RedwoodProject {
  readonly filepath: string
  readonly name: string

  cells?: RedwoodCell[]

  constructor({ pathWithinProject = '', full = false } = {}) {
    const rootPath = pathWithinProject
      ? getBaseDirFromFile(pathWithinProject)
      : getBaseDir()

    // TODO: Consider reading the toml config to get the web.title from it?
    this.filepath = rootPath
    this.name = path.parse(this.filepath).name

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
