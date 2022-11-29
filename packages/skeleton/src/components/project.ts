import { getBaseDir, getBaseDirFromFile } from '@redwoodjs/internal/dist/index'

import { getCells, RedwoodCell } from './cell'

export interface RedwoodProject {
  path: string

  cells?: RedwoodCell[]
}

export function getProject(pathWithinProject = ''): RedwoodProject {
  const rootPath = pathWithinProject
    ? getBaseDirFromFile(pathWithinProject)
    : getBaseDir()
  return {
    path: rootPath,
  }
}

export function getFullProject(pathWithinProject = ''): RedwoodProject {
  const project = getProject(pathWithinProject)
  project.cells = getCells()
  return project
}
