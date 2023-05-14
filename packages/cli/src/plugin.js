import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getConfig, getPaths } from './lib'
import { installModule } from './lib/packages'

const PLUGIN_CACHE_FILENAME = 'command-cache.json'

function checkPluginListAndWarn(plugins) {
  // Plugins must define a package and version
  for (const plugin of plugins) {
    if (!plugin.package) {
      console.warn(
        chalk.yellow(
          `⚠️  A plugin is missing a package name, it cannot be loaded.`
        )
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
  const pluginNames = plugins.map((p) => p.package)
  if (plugins.length !== new Set(pluginNames).size) {
    console.warn(
      chalk.yellow(
        '⚠️  Duplicate plugin names found in redwood.toml, duplicates will be ignored.'
      )
    )
  }

  // Plugins should be published to npm under a scope which is used as the namespace
  const namespaces = plugins.map((p) => p.package.split('/')[0])
  namespaces.forEach((ns) => {
    if (!ns.startsWith('@')) {
      console.warn(
        chalk.yellow(
          `⚠️  Plugin "${ns}" is missing a scope/namespace, it will not be loaded.`
        )
      )
    }
  })
}

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

  // Order alphabetically but with @redwoodjs packages first
  const namespaces = Array.from(
    redwoodPackages.map((p) => p.split('/')[0])
  ).sort()
  namespaces.push(
    ...Array.from(thirdPartyPackages.map((p) => p.split('/')[0])).sort()
  )

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

    // Load plugins for this namespace
    const namespaceCommands = []
    for (const namespacePlugin of namespacePlugins) {
      // Check the cache to see if we can skip loading this plugin
      // If this plugin doesn't have a command that matches the first word we can skip loading it
      // If we're showing the namespace help we want to load all plugins for observability
      const cacheEntry = pluginCommandCache[namespacePlugin.package]
      if (!showNamespaceHelp && cacheEntry && !cacheEntry.includes(firstWord)) {
        continue
      }

      let plugin
      try {
        plugin = await import(namespacePlugin.package)
      } catch (error) {
        // TODO: Batch all missing plugins and install them in one go
        if (error.code === 'MODULE_NOT_FOUND') {
          if (!autoInstall) {
            console.warn(
              chalk.yellow(
                `⚠️  Plugin "${namespacePlugin.package}" cannot be loaded because it is not installed and "autoInstall" is disabled.`
              )
            )
            continue
          }
          console.log(
            chalk.green(`Installing plugin "${namespacePlugin.package}"...`)
          )
          // Install the plugin
          await installModule(
            namespacePlugin.package,
            namespacePlugin.version,
            true
          )
          plugin = await import(namespacePlugin.package)
        }
      }

      if (!plugin) {
        console.log(
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

    // If we didn't load any commands for this namespace we can skip registering it
    // unless we're loading all namespaces for the help output
    // E.g. if we filtered out all commands using the cache
    if (namespaceCommands.length === 0 && !showRootHelp) {
      // TODO: Maybe we should just go back and load all plugins so yargs can show its
      // help output for the command the user is trying to run?
      process.on('exit', () => {
        console.warn(
          chalk.yellow(
            `⚠️  No CLI plugins could provide that command. Please try "yarn rw ${
              namespace === '@redwoodjs' ? '' : namespace
            } --help" for more specific help.`
          )
        )
      })
      continue
    }

    // Register all commands we loaded for this namespace
    // If the namespace is @redwoodjs, we don't need to nest the commands under a namespace
    if (namespace === '@redwoodjs') {
      yargs.command(namespaceCommands)
    } else {
      yargs.command({
        command: `${namespace} <command>`,
        describe: `${namespace} plugin commands`,
        builder: (yargs) => {
          yargs.command(namespaceCommands)
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
