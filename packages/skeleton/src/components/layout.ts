import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodSkeleton } from './base'
import type { RedwoodProject } from './project'

export class RedwoodLayout extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  constructor(filepath: string) {
    super(filepath)
  }

  // Diagnostics

  getStatistics(): string {
    throw new Error('Method not implemented.')
  }
}

export function extractLayout(filepath: string): RedwoodLayout {
  return new RedwoodLayout(filepath)
}

export function extractLayouts(
  project: RedwoodProject | undefined = undefined
): RedwoodLayout[] {
  const layouts: RedwoodLayout[] = []

  const layoutsPath = project
    ? getPaths(project.filepath).web.layouts
    : getPaths().web.layouts

  if (!fs.existsSync(layoutsPath)) {
    return layouts
  }

  // TODO: Confirm this the condition to detect a layout
  // Layouts must be defined within a file which ends with `Layout.{js, jsx, tsx}`
  const getLayoutFiles = (directory: string) => {
    const layoutFiles: string[] = []
    const directoryContents = fs.readdirSync(directory)
    directoryContents.forEach((content) => {
      const stat = fs.lstatSync(path.join(directory, content))
      if (stat.isDirectory()) {
        layoutFiles.push(...getLayoutFiles(path.join(directory, content)))
      } else if (stat.isFile()) {
        if (content.match(/.+Layout\.(js|jsx|tsx)$/)) {
          layoutFiles.push(path.join(directory, content))
        }
      }
    })
    return layoutFiles
  }

  const layoutFiles = getLayoutFiles(layoutsPath)
  layoutFiles.forEach((layoutPath) => {
    layouts.push(extractLayout(layoutPath))
  })

  return layouts
}
