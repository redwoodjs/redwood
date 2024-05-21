import fs from 'node:fs'
import path from 'node:path'

import {
  ensurePosixPath,
  getPaths,
  importStatementPath,
} from '@redwoodjs/project-config'
import { getProject } from '@redwoodjs/structure/dist/index'
import type { RWPage } from '@redwoodjs/structure/dist/model/RWPage'
import type { RWRoute } from '@redwoodjs/structure/dist/model/RWRoute'

import { makeFilePath } from '../utils'

export function getEntries() {
  const entries: Record<string, string> = {}

  // Build the entries object based on routes and pages
  // Given the page's route, we can determine whether or not
  // the entry requires authentication checks
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  // Add the various pages
  const pages = routes.map((route: RWRoute) => route.page) as RWPage[]

  for (const page of pages) {
    entries[page.constName] = ensurePosixPath(importStatementPath(page.path))
  }

  // Add the ServerEntry entry, noting we use the "__rwjs__" prefix to avoid
  // any potential conflicts with user-defined entries
  const serverEntry = getPaths().web.entryServer
  if (!serverEntry) {
    throw new Error('Server Entry file not found')
  }
  entries['__rwjs__ServerEntry'] = serverEntry

  const routesPath = path.join(getPaths().web.src, 'Routes.tsx')
  if (fs.existsSync(routesPath)) {
    entries['__rwjs__Routes'] = routesPath
  }

  return entries
}

export async function getEntriesFromDist(): Promise<Record<string, string>> {
  const entriesDist = getPaths().web.distRscEntries
  const { serverEntries } = await import(makeFilePath(entriesDist))
  return serverEntries
}
