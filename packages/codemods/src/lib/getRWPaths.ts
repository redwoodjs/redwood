import fs from 'fs'
import path from 'path'

import merge from 'deepmerge'
import findUp from 'findup-sync'
import toml from 'toml'

enum TargetEnum {
  NODE = 'node',
  BROWSER = 'browser',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
}

interface NodeTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.NODE
  schemaPath: string
}

interface BrowserTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  // TODO: apiProxyHost: string
  apiProxyPort: number
  apiProxyPath: string
  fastRefresh: boolean
  a11y: boolean
}

interface Config {
  web: BrowserTargetConfig
  api: NodeTargetConfig
  browser: {
    open: boolean | string
  }
  generate: {
    tests: boolean
    stories: boolean
    nestScaffoldByModel: boolean
  }
  experimental: {
    esbuild: boolean
  }
}

// Note that web's includeEnvironmentVariables is handled in `webpack.common.js`
// https://github.com/redwoodjs/redwood/blob/d51ade08118c17459cebcdb496197ea52485364a/packages/core/config/webpack.common.js#L19
const DEFAULT_CONFIG: Config = {
  web: {
    title: 'Redwood App',
    host: 'localhost',
    port: 8910,
    path: './web',
    target: TargetEnum.BROWSER,
    apiProxyPath: '/.netlify/functions',
    apiProxyPort: 8911,
    fastRefresh: true,
    a11y: true,
  },
  api: {
    title: 'Redwood App',
    host: 'localhost',
    port: 8911,
    path: './api',
    target: TargetEnum.NODE,
    schemaPath: './api/db/schema.prisma',
  },
  browser: {
    open: false,
  },
  generate: {
    tests: true,
    stories: true,
    nestScaffoldByModel: true,
  },
  experimental: {
    esbuild: false,
  },
}

/**
 * These configuration options are modified by the user via the Redwood
 * config file.
 */
const getConfig = (configPath = getConfigPath()): Config => {
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf8')
    return merge(DEFAULT_CONFIG, toml.parse(rawConfig))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}

interface NodeTargetPaths {
  base: string
  dataMigrations: string
  directives: string
  db: string
  dbSchema: string
  src: string
  functions: string
  graphql: string
  lib: string
  generators: string
  services: string
  config: string
  dist: string
  types: string
}

interface BrowserTargetPaths {
  base: string
  src: string
  app: string
  generators: string
  index: string | null
  routes: string
  pages: string
  components: string
  layouts: string
  config: string
  webpack: string
  postcss: string
  storybookConfig: string
  storybookPreviewConfig: string
  dist: string
  types: string
}

interface Paths {
  base: string
  generated: {
    base: string
    schema: string
    types: {
      includes: string
      mirror: string
    }
    prebuild: string
  }
  web: BrowserTargetPaths
  api: NodeTargetPaths
  scripts: string
}

const CONFIG_FILE_NAME = 'redwood.toml'

// TODO: Remove these.
const PATH_API_DIR_FUNCTIONS = 'api/src/functions'
const PATH_RW_SCRIPTS = 'scripts'
const PATH_API_DIR_GRAPHQL = 'api/src/graphql'
const PATH_API_DIR_CONFIG = 'api/src/config'
const PATH_API_DIR_LIB = 'api/src/lib'
const PATH_API_DIR_GENERATORS = 'api/generators'
const PATH_API_DIR_SERVICES = 'api/src/services'
const PATH_API_DIR_DIRECTIVES = 'api/src/directives'
const PATH_API_DIR_SRC = 'api/src'
const PATH_WEB_ROUTES = 'web/src/Routes' // .js|.tsx
const PATH_WEB_DIR_LAYOUTS = 'web/src/layouts/'
const PATH_WEB_DIR_PAGES = 'web/src/pages/'
const PATH_WEB_DIR_COMPONENTS = 'web/src/components'
const PATH_WEB_DIR_SRC = 'web/src'
const PATH_WEB_DIR_SRC_APP = 'web/src/App'
const PATH_WEB_DIR_SRC_INDEX = 'web/src/index' // .js|.tsx
const PATH_WEB_DIR_GENERATORS = 'web/generators'
const PATH_WEB_DIR_CONFIG = 'web/config'
const PATH_WEB_DIR_CONFIG_WEBPACK = 'web/config/webpack.config.js'
const PATH_WEB_DIR_CONFIG_POSTCSS = 'web/config/postcss.config.js'
const PATH_WEB_DIR_CONFIG_STORYBOOK_CONFIG = 'web/config/storybook.config.js'
const PATH_WEB_DIR_CONFIG_STORYBOOK_PREVIEW = 'web/config/storybook.preview.js'

const PATH_WEB_DIR_DIST = 'web/dist'

/**
 * Search the parent directories for the Redwood configuration file.
 */
const getConfigPath = (
  cwd: string = process.env.RWJS_CWD ?? process.cwd()
): string => {
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
const getBaseDir = (configPath: string = getConfigPath()): string => {
  return path.dirname(configPath)
}

/**
 * Use this to resolve files when the path to the file is known,
 * but the extension is not.
 */
const resolveFile = (
  filePath: string,
  extensions: string[] = ['.js', '.tsx', '.ts', '.jsx']
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
// TODO: Make this a proxy and make it lazy.
const getRWPaths = (BASE_DIR: string = getBaseDir()): Paths => {
  const routes = resolveFile(path.join(BASE_DIR, PATH_WEB_ROUTES)) as string
  const { schemaPath } = getConfig(getConfigPath(BASE_DIR)).api
  const schemaDir = path.dirname(schemaPath)

  const paths = {
    base: BASE_DIR,

    generated: {
      base: path.join(BASE_DIR, '.redwood'),
      schema: path.join(BASE_DIR, '.redwood/schema.graphql'),
      types: {
        includes: path.join(BASE_DIR, '.redwood/types/includes'),
        mirror: path.join(BASE_DIR, '.redwood/types/mirror'),
      },
      prebuild: path.join(BASE_DIR, '.redwood/prebuild'),
    },

    scripts: path.join(BASE_DIR, PATH_RW_SCRIPTS),

    api: {
      base: path.join(BASE_DIR, 'api'),
      dataMigrations: path.join(BASE_DIR, schemaDir, 'dataMigrations'),
      db: path.join(BASE_DIR, schemaDir),
      dbSchema: path.join(BASE_DIR, schemaPath),
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
      lib: path.join(BASE_DIR, PATH_API_DIR_LIB),
      generators: path.join(BASE_DIR, PATH_API_DIR_GENERATORS),
      config: path.join(BASE_DIR, PATH_API_DIR_CONFIG),
      services: path.join(BASE_DIR, PATH_API_DIR_SERVICES),
      directives: path.join(BASE_DIR, PATH_API_DIR_DIRECTIVES),
      src: path.join(BASE_DIR, PATH_API_DIR_SRC),
      dist: path.join(BASE_DIR, 'api/dist'),
      types: path.join(BASE_DIR, 'api/types'),
    },

    web: {
      routes,
      base: path.join(BASE_DIR, 'web'),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
      layouts: path.join(BASE_DIR, PATH_WEB_DIR_LAYOUTS),
      src: path.join(BASE_DIR, PATH_WEB_DIR_SRC),
      generators: path.join(BASE_DIR, PATH_WEB_DIR_GENERATORS),
      app: resolveFile(path.join(BASE_DIR, PATH_WEB_DIR_SRC_APP)) as string,
      index: resolveFile(path.join(BASE_DIR, PATH_WEB_DIR_SRC_INDEX)),
      config: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG),
      webpack: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG_WEBPACK),
      postcss: path.join(BASE_DIR, PATH_WEB_DIR_CONFIG_POSTCSS),
      storybookConfig: path.join(
        BASE_DIR,
        PATH_WEB_DIR_CONFIG_STORYBOOK_CONFIG
      ),
      storybookPreviewConfig: path.join(
        BASE_DIR,
        PATH_WEB_DIR_CONFIG_STORYBOOK_PREVIEW
      ),
      dist: path.join(BASE_DIR, PATH_WEB_DIR_DIST),
      types: path.join(BASE_DIR, 'web/types'),
    },
  }

  return paths
}

export default getRWPaths
