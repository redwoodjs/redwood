import path from 'path'
import fs from 'fs'

import findUp from 'findup-sync'

import { Paths, PagesDependency } from './types'

const CONFIG_FILE_NAME = 'redwood.toml'

const PATH_API_DIR_FUNCTIONS = 'api/src/functions'
const PATH_API_DIR_GRAPHQL = 'api/src/graphql'
const PATH_API_DIR_DB = 'api/prisma'
const PATH_API_DIR_SERVICES = 'api/src/services'
const PATH_API_DIR_SRC = 'api/src'
const PATH_WEB_ROUTES = 'web/src/Routes.js'
const PATH_WEB_DIR_LAYOUTS = 'web/src/layouts/'
const PATH_WEB_DIR_PAGES = 'web/src/pages/'
const PATH_WEB_DIR_COMPONENTS = 'web/src/components'
const PATH_WEB_DIR_SRC = 'web/src'

/**
 * Search the parent directories for the Redwood configuration file.
 */
export const getConfigPath = (): string => {
  const configPath = findUp(CONFIG_FILE_NAME)
  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Redwood project?`
    )
  }
  return configPath
}

/**
 * The Redwood config file is used as an anchor for the base directory of a project.
 */
export const getBaseDir = (configPath: string = getConfigPath()): string => {
  return path.dirname(configPath)
}

/**
 * Path constants that are relevant to a Redwood project.
 */
export const getPaths = (BASE_DIR: string = getBaseDir()): Paths => {
  return {
    base: BASE_DIR,
    api: {
      db: path.join(BASE_DIR, PATH_API_DIR_DB),
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
      services: path.join(BASE_DIR, PATH_API_DIR_SERVICES),
      src: path.join(BASE_DIR, PATH_API_DIR_SRC),
    },
    web: {
      routes: path.join(BASE_DIR, PATH_WEB_ROUTES),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
      layouts: path.join(BASE_DIR, PATH_WEB_DIR_LAYOUTS),
      src: path.join(BASE_DIR, PATH_WEB_DIR_SRC),
    },
  }
}

/**
 * Recursively process the pages directory and return information useful for
 * automated imports.
 */
export const processPagesDir = (
  webPagesDir: string = getPaths().web.pages,
  prefix: Array<string> = []
): Array<PagesDependency> => {
  const deps: Array<PagesDependency> = []
  const entries = fs.readdirSync(webPagesDir, { withFileTypes: true })

  // Iterate over a dir's entries, recursing as necessary into
  // subdirectories.
  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      // Actual JS files reside in a directory of the same name, so let's
      // construct the filename of the actual Page file.
      const testFile = path.join(webPagesDir, entry.name, entry.name + '.js')

      if (fs.existsSync(testFile)) {
        // If the Page exists, then construct the dependency object and push it
        // onto the deps array.
        const basename = path.posix.basename(entry.name, '.js')
        const importName = prefix.join() + basename
        const importFile = path.join('src', 'pages', ...prefix, basename)
        deps.push({
          const: importName,
          path: path.join(webPagesDir, entry.name),
          importStatement: `const ${importName} = { name: '${importName}', loader: () => import('${importFile}') }`,
        })
      } else {
        // If the Page doesn't exist then we are in a directory of Page
        // directories, so let's recurse into it and do the whole thing over
        // again.
        const newPrefix = [...prefix, entry.name]
        deps.push(
          ...processPagesDir(path.join(webPagesDir, entry.name), newPrefix)
        )
      }
    }
  })
  return deps
}
