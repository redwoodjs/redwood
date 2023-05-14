import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getConfig, getPaths } from './lib'
import { installModule } from './lib/packages'

/**
 * The file inside .redwood which will contain cached plugin command mappings
 */
const PLUGIN_CACHE_FILENAME = 'command-cache.json'

/**
 * Attempts to load all CLI plugins as defined in the redwood.toml file
 *
 * @param {*} yargs A yargs instance
 * @returns The yargs instance with plugins loaded
 */
export async function loadPlugins(yargs) {
  const { plugins, autoInstall } = getConfig().experimental.cli

  const enabledPlugins = plugins.filter((p) => p.enabled ?? true)

  // Print warnings about invalid plugins
  checkPluginListAndWarn(enabledPlugins)

  const redwoodPackages = new Set()
  const thirdPartyPackages = new Set()
  for (const plugin of enabledPlugins) {
    // Skip invalid plugins
    if (!plugin.package || !plugin.version) {
      continue
    }
    // Skip non-scoped packages
    if (!plugin.package.startsWith('@')) {
      continue
    }
    if (plugin.package.startsWith('@redwoodjs/')) {
      redwoodPackages.add(plugin.package)
    } else {
      thirdPartyPackages.add(plugin.package)
    }
  }

  // Order alphabetically but with @redwoodjs namespace first
  const namespaces = Array.from(
    thirdPartyPackages.map((p) => p.split('/')[0])
  ).sort()
  if (redwoodPackages.size > 0) {
    namespaces.unshift('@redwoodjs')
  }

  // If the user is running a help command or no command was given
  // we want to load all plugins for observability in the help output
  const processArgv = process.argv.slice(2).join(' ')
  const showRootHelp =
    processArgv === '--help' || processArgv === '-h' || processArgv === ''

  // Filter the namespaces based on the command line args to
  // reduce the number of plugins we need to load
  const namespacesInUse = namespaces.filter(
    (ns) => showRootHelp || processArgv.includes(ns)
  )
  if (namespacesInUse.length === 0) {
    // If no namespace is in use we're using the default @redwoodjs namespace which
    // is just an empty string ''
    namespacesInUse.push('@redwoodjs')
  }

  // TODO: We should have some mechanism to fetch the cache from an online or precomputed
  // source this will allow us to have a cache hit on the first run of a command
  let pluginCommandCache = {}
  try {
    pluginCommandCache = JSON.parse(
      fs.readFileSync(
        path.join(getPaths().generated.base, PLUGIN_CACHE_FILENAME)
      )
    )
  } catch (error) {
    // If the cache file doesn't exist we can just ignore it and continue
    if (error.code !== 'ENOENT') {
      console.error(error)
    }
  }

  // We filter plugins based on the first word which depends on if a namespace is in use
  const firstWord = process.argv[2]?.includes('@')
    ? process.argv[3]
    : process.argv[2]
  const showNamespaceHelp =
    firstWord === '--help' || firstWord === '-h' || firstWord === undefined

  for (const namespace of namespacesInUse) {
    // Get all the plugins for this namespace
    const namespacePlugins = new Set(
      enabledPlugins.filter((p) => p.package.startsWith(namespace))
    )
    // Do nothing if there are no enabled plugins for this namespace
    if (namespacePlugins.size === 0) {
      continue
    }

    // For help output we only show the root level commands which for third
    // party plugins is just the namespace. No need to load the plugin for this.
    if (showRootHelp && namespace !== '@redwoodjs') {
      yargs.command({
        command: `${namespace} <command>`,
        describe: `${namespace} plugin commands`,
        builder: () => {},
        handler: () => {},
      })
      continue
    }

    const namespacePluginsToLoad = []
    if (showNamespaceHelp) {
      // If we're showing the namespace help we want to load all plugins for observability
      namespacePluginsToLoad.push(...namespacePlugins)
    } else {
      // Attempt to find a plugin that matches the first word
      for (const namespacePlugin of namespacePlugins) {
        const cacheEntry = pluginCommandCache[namespacePlugin.package]
        if (cacheEntry !== undefined && cacheEntry.includes(firstWord)) {
          namespacePluginsToLoad.push(namespacePlugin)
          // Only one plugin can match the first word so we break here
          break
        }
      }
    }

    // If we didn't find any plugins to satify the first word we load all plugins so yargs can give
    // an appropriate help message
    if (namespacePluginsToLoad.length === 0) {
      namespacePluginsToLoad.push(...namespacePlugins)
    }

    // Load plugins for this namespace
    const namespaceCommands = []
    for (const namespacePlugin of namespacePluginsToLoad) {
      // Attempt to load the plugin
      const plugin = await loadPluginPackage(
        namespacePlugin.package,
        namespacePlugin.version,
        autoInstall
      )

      // Show an error if the plugin failed to load
      if (!plugin) {
        console.error(
          chalk.red(`❌  Plugin "${namespacePlugin.package}" failed to load.`)
        )
        continue
      }

      // Add the plugin to the cache entry
      pluginCommandCache[namespacePlugin.package] = []
      for (const command of plugin.commands) {
        // Add the first word of the command to the cache entry
        pluginCommandCache[namespacePlugin.package].push(
          command.command.split(' ')[0]
        )
        // Add any aliases of the command to the cache entry
        pluginCommandCache[namespacePlugin.package].push(
          ...(command.aliases || [])
        )
      }

      // Add these commands to the namespace list
      namespaceCommands.push(...plugin.commands)
    }

    // Register all commands we loaded for this namespace
    // If the namespace is @redwoodjs, we don't need to nest the commands under a namespace
    if (namespace === '@redwoodjs') {
      yargs.command(namespaceCommands).demandCommand()
    } else {
      yargs.command({
        command: `${namespace} <command>`,
        describe: `${namespace} plugin commands`,
        builder: (yargs) => {
          yargs.command(namespaceCommands).demandCommand()
        },
        handler: () => {},
      })
    }
  }

  // Cache the plugin-command mapping to optimise loading on the next invocation
  try {
    fs.writeFileSync(
      path.join(getPaths().generated.base, PLUGIN_CACHE_FILENAME),
      JSON.stringify(pluginCommandCache)
    )
  } catch (error) {
    console.error(error)
  }

  return yargs
}

/**
 * Logs warnings for any plugins that have invalid definitions in the redwood.toml file
 *
 * @param {any[]} plugins An array of plugin objects read from the redwood.toml file
 */
function checkPluginListAndWarn(plugins) {
  // Plugins must define a package and version
  for (const plugin of plugins) {
    if (!plugin.package) {
      console.warn(
        chalk.yellow(`⚠️  A plugin is missing a package, it cannot be loaded.`)
      )
    }
    if (!plugin.version) {
      console.warn(
        chalk.yellow(
          `⚠️  Plugin "${plugin.package}" is missing a version, it cannot be loaded.`
        )
      )
    }
  }

  // Plugins should only occur once in the list
  const pluginPackages = plugins
    .map((p) => p.package)
    .filter((p) => p !== undefined)
  if (pluginPackages.length !== new Set(pluginPackages).size) {
    console.warn(
      chalk.yellow(
        '⚠️  Duplicate plugin packages found in redwood.toml, duplicates will be ignored.'
      )
    )
  }

  // Plugins should be published to npm under a scope which is used as the namespace
  const namespaces = plugins.map((p) => p.package?.split('/')[0])
  namespaces.forEach((ns) => {
    if (ns !== undefined && !ns.startsWith('@')) {
      console.warn(
        chalk.yellow(
          `⚠️  Plugin "${ns}" is missing a scope/namespace, it will not be loaded.`
        )
      )
    }
  })
}

/**
 * Attempts to load a plugin package and return it. Returns null if the plugin failed to load.
 *
 * @param {string} packageName The npm package name of the plugin
 * @param {string} packageVersion The npm package version of the plugin
 * @param {boolean} autoInstall Whether to automatically install the plugin package if it is not installed already
 * @returns The plugin package or null if it failed to load
 */
async function loadPluginPackage(packageName, packageVersion, autoInstall) {
  try {
    return await import(packageName)
  } catch (error) {
    // TODO: Batch all missing plugins and install them in one go
    if (error.code === 'MODULE_NOT_FOUND') {
      if (!autoInstall) {
        console.warn(
          chalk.yellow(
            `⚠️  Plugin "${packageName}" cannot be loaded because it is not installed and "autoInstall" is disabled.`
          )
        )
      } else {
        // Install the plugin
        console.log(chalk.green(`Installing plugin "${packageName}"...`))
        const installed = await installPluginPackage(
          packageName,
          packageVersion
        )
        if (installed) {
          return await import(packageName)
        }
      }
    } else {
      console.error(error)
    }
  }
  return null
}

/**
 * Attempts to install a plugin package. Installs the package as a dev dependency.
 *
 * @param {string} packageName The npm package name of the plugin
 * @param {string} packageVersion The npm package version of the plugin
 * @returns True if the plugin was installed successfully, false otherwise
 */
async function installPluginPackage(packageName, packageVersion) {
  try {
    await installModule(packageName, packageVersion, true)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
