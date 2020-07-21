import path from 'path'
import fs from 'fs'

import findUp from 'findup-sync'

export interface NodeTargetPaths {
  base: string
  db: string
  dbSchema: string
  src: string
  functions: string
  graphql: string
  lib: string
  services: string
  config: string
}

export interface BrowserTargetPaths {
  base: string
  src: string
  routes: string
  pages: string
  components: string
  layouts: string
  config: string
  webpack: string
  postcss: string
}

export interface Paths {
  cache: string
  base: string
  web: BrowserTargetPaths
  api: NodeTargetPaths
}

export interface PagesDependency {
  importName: string
  importPath: string
  const: string
  path: string
  importStatement: string
}

const CONFIG_FILE_NAME = 'redwood.toml'

const PATH_API_DIR_FUNCTIONS = 'api/src/functions'
const PATH_API_DIR_GRAPHQL = 'api/src/graphql'
const PATH_API_DIR_DB = 'api/prisma'
const PATH_API_DIR_DB_SCHEMA = 'api/prisma/schema.prisma'
const PATH_API_DIR_CONFIG = 'api/src/config'
const PATH_API_DIR_LIB = 'api/src/lib'
const PATH_API_DIR_SERVICES = 'api/src/services'
const PATH_API_DIR_SRC = 'api/src'
const PATH_WEB_ROUTES = 'web/src/Routes' // .js|.tsx
const PATH_WEB_DIR_LAYOUTS = 'web/src/layouts/'
const PATH_WEB_DIR_PAGES = 'web/src/pages/'
const PATH_WEB_DIR_COMPONENTS = 'web/src/components'
const PATH_WEB_DIR_SRC = 'web/src'
const PATH_WEB_DIR_CONFIG = 'web/config'
const PATH_WEB_DIR_CONFIG_WEBPACK = 'web/config/webpack.config.js'
const PATH_WEB_DIR_CONFIG_POSTCSS = 'web/config/postcss.config.js'

/**
 * Search the parent directories for the Redwood configuration file.
 */
export const getConfigPath = (cwd: string = __dirname): string => {
  const configPath = findUp(CONFIG_FILE_NAME, { cwd })
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

export const getBaseDirFromFile = (file: string) => {
  return getBaseDir(getConfigPath(path.dirname(file)))
}

/**
 * Use this to resolve files when the path to the file is known, but the extension
 * is not.
 */
export const resolveFile = (
  filePath: string,
  extensions: string[] = ['.js', '.tsx', '.ts']
): string | null => {
  for (const extension of extensions) {
    const p = `${filePath}${extension}`
    if (fs.existsSync(p)) {
      return p
    }
  }
  return null
}

/**
 * Path constants that are relevant to a Redwood project.
 */
export const getPaths = (BASE_DIR: string = getBaseDir()): Paths => {
  const routes = resolveFile(path.join(BASE_DIR, PATH_WEB_ROUTES)) as string

  // We store ambient type declerations and our test database over here.
  const cache = path.join(BASE_DIR, 'node_modules', '.redwood')
  try {
    fs.mkdirSync(cache)
  } catch (e) {
    // noop
  }

  return {
    base: BASE_DIR,
    cache,
    api: {
      base: path.join(BASE_DIR, 'api'),
      db: path.join(BASE_DIR, PATH_API_DIR_DB),
      dbSchema: path.join(BASE_DIR, PATH_API_DIR_DB_SCHEMA),
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
      lib: path.join(BASE_DIR, PATH_API_DIR_LIB),
      config: path.join(BASE_DIR, PATH_API_DIR_CONFIG),
      services: path.join(BASE_DIR, PATH_API_DIR_SERVICES),
      src: path.join(BASE_DIR, PATH_API_DIR_SRC),
    },
    web: {
      routes,
      base: path.join(BASE_DIR, 'web'),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
      layouts: path.join(BASE_DIR, PATH_WEB_DIR_LAYOUTS),
      src: path.join(BASE_DIR, PATH_WEB_DIR_SRC),
      config: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG),
      webpack: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG_WEBPACK),
      postcss: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG_POSTCSS),
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
      try {
        // Actual page js or tsx files reside in a directory of the same
        // name (supported by: directory-named-webpack-plugin), so let's
        // construct the filename of the actual Page file.
        // `require.resolve` will throw if a module cannot be found.
        const importPath = path.join(webPagesDir, entry.name, entry.name)
        require.resolve(importPath)

        // If the Page exists, then construct the dependency object and push it
        // onto the deps array.
        const basename = path.posix.basename(entry.name)
        const importName = prefix.join() + basename
        // `src/pages/<PageName>`
        const importFile = ['src', 'pages', ...prefix, basename].join('/')
        deps.push({
          importName,
          importPath,
          const: importName,
          path: path.join(webPagesDir, entry.name),
          importStatement: `const ${importName
            .split(',')
            .join('')} = { name: '${importName
            .split(',')
            .join('')}', loader: () => import('${importFile}') }`,
        })
      } catch (e) {
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

/**
 * Converts Windows-style paths to Posix-style
 * C:\Users\Bob\dev\Redwood -> /c/Users/Bob/dev/Redwood
 *
 * The conversion only happens on Windows systems, and only for paths that are
 * not already Posix-style
 *
 * @param path Filesystem path
 */
export const ensurePosixPath = (path: string) => {
  let posixPath = path

  if (process.platform === 'win32') {
    if (/^[A-Z]:\\/.test(path)) {
      const drive = path[0].toLowerCase()
      posixPath = `/${drive}/${path.substring(3)}`
    }

    posixPath = posixPath.replace(/\\/g, '/')
  }

  return posixPath
}
