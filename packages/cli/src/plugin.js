import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getConfig, getPaths } from './lib'
import { installModule, isModuleInstalled } from './lib/packages'

/**
 * The file inside .redwood which will contain cached plugin command mappings
 */
const PLUGIN_CACHE_FILENAME = 'commandCache.json'

const PLUGIN_CACHE_DEFAULT = {
  '@redwoodjs/cli-storybook': {
    storybook: {
      aliases: ['sb'],
      description:
        'Launch Storybook: a tool for building UI components and pages in isolation',
    },
  },
  '@redwoodjs/cli-data-migrate': {
    'data-migrate': {
      aliases: ['dataMigrate', 'dm'],
      description: 'Migrate the data in your database',
    },
  },
}

const PLUGIN_CACHE_BUILTIN = [
  'build',
  'check',
  'diagnostics',
  'console',
  'c',
  'deploy',
  'destroy',
  'd',
  'dev',
  'exec',
  'experimental',
  'exp',
  'generate',
  'g',
  'info',
  'lint',
  'prerender',
  'render',
  'prisma',
  'record',
  'serve',
  'setup',
  'test',
  'ts-to-js',
  'type-check',
  'tsc',
  'tc',
  'upgrade',
]

/**
 * Attempts to load all CLI plugins as defined in the redwood.toml file
 *
 * @param {*} yargs A yargs instance
 * @returns The yargs instance with plugins loaded
 */
export async function loadPlugins(yargs) {
  // We filter plugins based on the first word which depends on if a namespace is in use
  const firstWord = process.argv[2]?.startsWith('@')
    ? process.argv[3]
    : process.argv[2]

  // Check for possible early exit for `yarn rw --version`
  const showRootVersion = firstWord === '--version'
  if (showRootVersion) {
    // We don't need to load any plugins in this case
    return yargs
  }

  // TODO: We should have some mechanism to fetch the cache from an online or precomputed
  // source this will allow us to have a cache hit on the first run of a command
  let pluginCommandCache = PLUGIN_CACHE_DEFAULT
  try {
    const localCommandCache = JSON.parse(
      fs.readFileSync(
        path.join(getPaths().generated.base, PLUGIN_CACHE_FILENAME)
      )
    )
    let valid = true
    for (const [key, value] of Object.entries(localCommandCache)) {
      if (key === '_builtin') {
        continue
      }
      valid &&= !Array.isArray(value)
    }
    if (valid) {
      pluginCommandCache = localCommandCache
    }
  } catch (error) {
    // If the cache file doesn't exist we can just ignore it and continue
    if (error.code !== 'ENOENT') {
      console.error(error)
    }
  }
  pluginCommandCache._builtin = PLUGIN_CACHE_BUILTIN

  // Check if the command is built in to the base CLI package
  if (pluginCommandCache._builtin.includes(firstWord)) {
    // If the command is built in we don't need to load any plugins
    return yargs
  }

  const { plugins, autoInstall } = getConfig().experimental.cli

  const enabledPlugins = plugins.filter(
    (p) => p.package !== undefined && (p.enabled ?? true)
  )

  // Print warnings about invalid plugins
  checkPluginListAndWarn(enabledPlugins)

  const redwoodPackages = new Set()
  const thirdPartyPackages = new Set()
  for (const plugin of enabledPlugins) {
    // Skip invalid plugins
    if (!plugin.package) {
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

  for (const namespace of namespacesInUse) {
    // Get all the plugins for this namespace
    const namespacePlugins = new Set(
      enabledPlugins.filter((p) => p.package.startsWith(namespace))
    )
    // Do nothing if there are no enabled plugins for this namespace
    if (namespacePlugins.size === 0) {
      continue
    }

    const namespacePluginsToLoad = []

    // Attempt to find a plugin that matches the first word
    for (const namespacePlugin of namespacePlugins) {
      const cacheEntry = pluginCommandCache[namespacePlugin.package]
      if (cacheEntry === undefined) {
        continue
      }
      const commands = Object.keys(cacheEntry)
      const allTriggers = commands.flatMap((c) => [
        c,
        ...(cacheEntry[c].aliases ?? []),
      ])
      if (allTriggers.includes(firstWord)) {
        namespacePluginsToLoad.push(namespacePlugin)
        // Only one plugin can match the first word so we break here
        break
      }
    }

    // For help output we only show the root level commands which for third
    // party plugins is just the namespace. No need to load the plugin for this.
    if (showRootHelp || namespacePluginsToLoad.length === 0) {
      if (namespace !== '@redwoodjs') {
        yargs.command({
          command: `${namespace} <command>`,
          describe: `${namespace} plugin commands`,
          builder: () => {},
          handler: () => {},
        })
      } else {
        // For the @redwoodjs namespace we want to show all the commands for each package
        for (const namespacePlugin of namespacePlugins) {
          // We get the details from the cache so we don't have to install/load the plugin package
          const cacheEntry = pluginCommandCache[namespacePlugin.package]
          if (cacheEntry === undefined) {
            // if we have the default cache entry set properly we should never end up here
            continue
          }
          const commands = Object.keys(cacheEntry)
          for (const command of commands) {
            yargs.command({
              command,
              describe: cacheEntry[command].description,
              aliases: cacheEntry[command].aliases,
              builder: () => {},
              handler: () => {},
            })
          }
        }
      }
      continue
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
      pluginCommandCache[namespacePlugin.package] = {}
      for (const command of plugin.commands) {
        pluginCommandCache[namespacePlugin.package][command.command] = {
          aliases: command.aliases,
          description: command.description,
        }
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
      JSON.stringify(pluginCommandCache, undefined, 2)
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
  // Plugins must define a package
  for (const plugin of plugins) {
    if (!plugin.package) {
      console.warn(
        chalk.yellow(`⚠️  A plugin is missing a package, it cannot be loaded.`)
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
 * @param {string | undefined} packageVersion The npm package version of the plugin, defaults to loading the plugin at the
 * same version as the cli
 * @param {boolean} autoInstall Whether to automatically install the plugin package if it is not installed already
 * @returns The plugin package or null if it failed to load
 */
async function loadPluginPackage(packageName, packageVersion, autoInstall) {
  // NOTE: This likely does not handle mismatch versions between what is installed and what is requested
  if (isModuleInstalled(packageName)) {
    return await import(packageName)
  }

  if (!autoInstall) {
    console.warn(
      chalk.yellow(
        `⚠️  Plugin "${packageName}" cannot be loaded because it is not installed and "autoInstall" is disabled.`
      )
    )
    return null
  }

  // Attempt to install the plugin
  console.log(chalk.green(`Installing plugin "${packageName}"...`))
  const installed = await installPluginPackage(packageName, packageVersion)
  if (installed) {
    return await import(packageName)
  }
  return null
}

/**
 * Attempts to install a plugin package. Installs the package as a dev dependency.
 *
 * @param {string} packageName The npm package name of the plugin
 * @param {string} packageVersion The npm package version of the plugin to install or undefined
 * to install the same version as the cli
 * @returns True if the plugin was installed successfully, false otherwise
 */
async function installPluginPackage(packageName, packageVersion) {
  try {
    await installModule(packageName, packageVersion)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
