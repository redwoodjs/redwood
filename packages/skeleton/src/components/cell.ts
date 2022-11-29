import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { getFileAST } from '../lib'

export interface RedwoodCell {
  path: string
}

export function isValid(cell: RedwoodCell): boolean {
  return cell.path === 'jgmw-placeholder'
}

function getCell(cellPath: string): RedwoodCell {
  const ast = getFileAST(cellPath)
  return {
    path: cellPath,
  }
}

export function getCells(): RedwoodCell[] {
  const cells: RedwoodCell[] = []

  const componentsPath = getPaths().web.components
  console.log('componentsPath', componentsPath)

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
    cells.push(getCell(cellPath))
  })

  return cells
}
