import path from 'node:path'

import type { PagesDependency } from '@redwoodjs/project-config'
import {
  ensurePosixPath,
  getPaths,
  processPagesDir,
} from '@redwoodjs/project-config'

const getPathRelativeToSrc = (maybeAbsolutePath: string) => {
  // If the path is already relative
  if (!path.isAbsolute(maybeAbsolutePath)) {
    return maybeAbsolutePath
  }

  return `./${path.relative(getPaths().web.src, maybeAbsolutePath)}`
}

const withRelativeImports = (page: PagesDependency) => {
  return {
    ...page,
    relativeImport: ensurePosixPath(getPathRelativeToSrc(page.importPath)),
  }
}

export function getEntries() {
  return processPagesDir()
    .map(withRelativeImports)
    .reduce(
      (acc, page) => {
        acc[page.importName] = page.path
        return acc
      },
      {} as Record<string, string>,
    )
}

export async function getEntriesFromDist(): Promise<Record<string, string>> {
  const entriesDist = getPaths().web.distRscEntries
  const { serverEntries } = await import(`file://${entriesDist}`)
  return serverEntries
}
