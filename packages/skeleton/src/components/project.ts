import { getBaseDir, getBaseDirFromFile } from '@redwoodjs/internal/dist/index'

import { getCells, RedwoodCell } from './cell'

export class RedwoodProject {
  readonly path: string

  cells?: RedwoodCell[]

  constructor({ pathWithinProject = '', full = false } = {}) {
    const rootPath = pathWithinProject
      ? getBaseDirFromFile(pathWithinProject)
      : getBaseDir()

    this.path = rootPath

    if (full) {
      this.cells = getCells(this)
    }
  }
}
