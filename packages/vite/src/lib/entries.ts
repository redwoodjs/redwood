import fs from 'node:fs'
import path from 'node:path'

import type { PagesDependency } from '@redwoodjs/project-config'
import {
  ensurePosixPath,
  getPaths,
  processPagesDir,
} from '@redwoodjs/project-config'

import { makeFilePath } from '../utils'

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

  const serverRoutesPath = path.join(getPaths().web.src, 'ServerRoutes.tsx')
  if (fs.existsSync(serverRoutesPath)) {
    entries['__rwjs__ServerRoutes'] = serverRoutesPath
  }

  // Add the ServerEntry entry, noting we use the "__rwjs__" prefix to avoid
  // any potential conflicts with user-defined entries
  const serverEntry = getPaths().web.entryServer
  if (!serverEntry) {
    throw new Error('Server Entry file not found')
  }
  entries['__rwjs__ServerEntry'] = serverEntry

  return entries
}

export async function getEntriesFromDist(): Promise<Record<string, string>> {
  const entriesDist = getPaths().web.distRscEntries
  const { serverEntries } = await import(makeFilePath(entriesDist))
  return serverEntries
}
