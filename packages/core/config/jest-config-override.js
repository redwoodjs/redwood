/**
 * This overrides https://github.com/facebook/jest/blob/master/packages/jest-config/src/index.ts
 * to circumvent a bug that blocks passing multiple Jest configs as JSON to the CLI
 */

const fs = require('graceful-fs')
const { tryRealpath } = require('jest-util')
const { readConfig } = require('jest-config')
const chalk = require('chalk')

const JEST_CONFIG_EXT_CJS = '.cjs'
const JEST_CONFIG_EXT_MJS = '.mjs'
const JEST_CONFIG_EXT_JS = '.js'
const JEST_CONFIG_EXT_JSON = '.json'
const JEST_CONFIG_EXT_ORDER = Object.freeze([
  JEST_CONFIG_EXT_JS,
  JEST_CONFIG_EXT_MJS,
  JEST_CONFIG_EXT_CJS,
  JEST_CONFIG_EXT_JSON,
])

const ensureNoDuplicateConfigs = (parsedConfigs, projects) => {
  if (projects.length <= 1) {
    return
  }

  const configPathMap = new Map()

  for (const config of parsedConfigs) {
    const { configPath } = config

    if (configPathMap.has(configPath)) {
      const message = `Whoops! Two projects resolved to the same config path: ${chalk.bold(
        String(configPath)
      )}:

  Project 1: ${chalk.bold(
    projects[parsedConfigs.findIndex((x) => x === config)]
  )}
  Project 2: ${chalk.bold(
    projects[
      parsedConfigs.findIndex((x) => x === configPathMap.get(configPath))
    ]
  )}

This usually means that your ${chalk.bold(
        '"projects"'
      )} config includes a directory that doesn't have any configuration recognizable by Jest. Please fix it.
`

      throw new Error(message)
    }
    if (configPath !== null) {
      configPathMap.set(configPath, config)
    }
  }
}

// Possible scenarios:
//  1. jest --config config.json
//  2. jest --projects p1 p2
//  3. jest --projects p1 p2 --config config.json
//  4. jest --projects p1
//  5. jest
//
// If no projects are specified, process.cwd() will be used as the default
// (and only) project.
exports.readConfigs = async function readConfigs(argv, projectPaths) {
  let globalConfig
  let hasDeprecationWarnings
  let configs = []
  let projects = projectPaths

  if (projectPaths.length === 1) {
    const parsedConfig = await readConfig(argv, projects[0])

    hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings
    globalConfig = parsedConfig.globalConfig
    configs = [parsedConfig.projectConfig]
    if (globalConfig.projects && globalConfig.projects.length) {
      // Even though we had one project in CLI args, there might be more
      // projects defined in the config.
      // In other words, if this was a single project,
      // and its config has `projects` settings, use that value instead.
      projects = globalConfig.projects
    }
  }

  if (projects.length > 0) {
    const projectIsCwd =
      process.platform === 'win32'
        ? projects[0] === tryRealpath(process.cwd())
        : projects[0] === process.cwd()

    const parsedConfigs = await Promise.all(
      projects
        .filter((root) => {
          // Ignore globbed files that cannot be `require`d.
          if (
            typeof root === 'string' &&
            fs.existsSync(root) &&
            !fs.lstatSync(root).isDirectory() &&
            !JEST_CONFIG_EXT_ORDER.some((ext) => root.endsWith(ext))
          ) {
            return false
          }

          return true
        })
        .map((root, projectIndex) => {
          const projectIsTheOnlyProject =
            projectIndex === 0 && projects.length === 1
          const skipArgvConfigOption = !(
            projectIsTheOnlyProject && projectIsCwd
          )

          return readConfig(
            argv,
            root,
            skipArgvConfigOption,
            process.cwd(),
            projectIndex
          )
        })
    )

    ensureNoDuplicateConfigs(parsedConfigs, projects)
    configs = parsedConfigs.map(({ projectConfig }) => projectConfig)
    if (!hasDeprecationWarnings) {
      hasDeprecationWarnings = parsedConfigs.some(
        ({ hasDeprecationWarnings }) => !!hasDeprecationWarnings
      )
    }
    // If no config was passed initially, use the one from the first project
    if (!globalConfig) {
      globalConfig = parsedConfigs[0].globalConfig
    }
  }

  if (!globalConfig || !configs.length) {
    throw new Error('jest: No configuration found for any project.')
  }

  return {
    configs,
    globalConfig,
    hasDeprecationWarnings: !!hasDeprecationWarnings,
  }
}
