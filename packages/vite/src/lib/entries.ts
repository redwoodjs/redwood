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
  const entries: Record<string, string> = {}

  // Add the various pages
  const pages = processPagesDir().map(withRelativeImports)
  for (const page of pages) {
    entries[page.importName] = page.path
  }

  // Add the "ServerEntry" entry
  const serverEntry = getPaths().web.entryServer
  if (!serverEntry) {
    throw new Error('Server Entry file not found')
  }
  entries['ServerEntry'] = serverEntry

  return entries
}

export async function getEntriesFromDist(): Promise<Record<string, string>> {
  const entriesDist = getPaths().web.distRscEntries
  const { serverEntries } = await import(`file://${entriesDist}`)
  return serverEntries
}
