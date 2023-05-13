import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

import { getConfig, getPaths } from './lib'
import { installModule } from './lib/packages'

const PLUGIN_CACHE_FILENAME = 'command-cache.json'

function validatePluginList(plugins) {
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
    if (!ns.includes('@')) {
      console.warn(
        chalk.yellow(
          `⚠️  Plugin "${ns}" is missing a scope/namespace, it will not be loaded.`
        )
      )
    }
  })
}

export async function loadPlugins(yargs) {
  const { plugins, autoInstall } = getConfig().cli

  // TODO: Remove this when we make the full switch to a total plugin based CLI
  // If we don't have any plugins in the toml file, add all the current @redwoodjs plugins
  if (plugins.length === 0) {
    // TODO: Start splitting up CLI into plugins
    // Nothing to add here at the moment
  }

  // Validate plugin list from redwood.toml, will print warnings to the console
  validatePluginList(plugins)

  // Get a list of all unique namespaces, sorted alphabetically but with @redwoodjs first
  // we ignore any invalid names i.e. names without an '@'
  const namespaces = Array.from(
    new Set([
      ...plugins
        .filter((p) => p.package.startsWith('@redwoodjs/'))
        .map((p) => p.package.split('/')[0])
        .sort((a, b) =>
          a.package > b.package ? 1 : b.package > a.package ? -1 : 0
        ),
      ...plugins
        .filter((p) => !p.package.startsWith('@redwoodjs/'))
        .map((p) => p.package.split('/')[0])
        .sort((a, b) =>
          a.package > b.package ? 1 : b.package > a.package ? -1 : 0
        ),
    ])
  ).filter((ns) => ns.includes('@'))

  // If the user is running a help command or no command was given
  // we want to load all plugins for observability in the help output
  const processArgv = process.argv.slice(2).join(' ')
  const showingRootHelp =
    processArgv === '--help' || processArgv === '-h' || processArgv === ''

  // Filter the namespaces based on the command line args to
  // reduce the number of plugins we need to load
  const namespacesInUse = namespaces.filter(
    (ns) => showingRootHelp || processArgv.includes(ns)
  )
  if (namespacesInUse.length === 0) {
    // If no namespace is in use we're using the default @redwoodjs namespace which
    // is just an empty string ''
    namespacesInUse.unshift('@redwoodjs')
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
  } catch (_error) {
    // No need to log this error, it's just a cache miss
    // console.log(error)
  }

  // We filter plugins based on the first word which depends on if a namespace is in use
  const firstWord = process.argv[2]?.includes('@')
    ? process.argv[3]
    : process.argv[2]
  const showingNamespaceHelp =
    firstWord === '--help' || firstWord === '-h' || firstWord === undefined

  for (const namespace of namespacesInUse) {
    // Get all the plugins for this namespace
    const namespacedPlugins = new Set(
      plugins.filter(
        (p) => p.package.startsWith(namespace) && (p.enabled ?? true)
      )
    )
    // Do nothing if there are no enabled plugins for this namespace
    if (namespacedPlugins.size === 0) {
      continue
    }

    // For help output we only show the root level commands which doesn't actually need
    // to load any plugins other than the @redwoodjs namespaced ones
    if (showingRootHelp && namespace !== '@redwoodjs') {
      yargs.command({
        command: `${namespace} <command>`,
        describe: `${namespace} plugin commands`,
        builder: () => {},
        handler: () => {},
      })
      continue
    }

    const namespacedCommands = []
    // Load all plugins for this namespace
    for (const namespacedPlugin of namespacedPlugins) {
      // Check the cache to see if we can skip loading this plugin
      // If this plugin doesn't have a command that matches the first word we can skip loading it
      const cacheEntry = pluginCommandCache[namespacedPlugin.package]
      if (
        !showingNamespaceHelp &&
        cacheEntry &&
        !cacheEntry.includes(firstWord)
      ) {
        continue
      }

      let plugin
      try {
        plugin = await import(namespacedPlugin.package)
      } catch (error) {
        // TODO: Batch all missing plugins and install them in one go
        if (error.code === 'MODULE_NOT_FOUND') {
          if (!autoInstall) {
            console.warn(
              chalk.yellow(
                `⚠️  Plugin "${namespacedPlugin.package}" cannot be loaded because it is not installed and "autoInstall" is disabled.`
              )
            )
            continue
          }
          console.log(
            chalk.green(`Installing plugin "${namespacedPlugin.package}"...`)
          )
          // Install the plugin
          await installModule(
            namespacedPlugin.package,
            namespacedPlugin.version,
            true
          )
          plugin = await import(namespacedPlugin.package)
        }
      }

      if (!plugin) {
        console.log(
          chalk.red(`❌  Plugin "${namespacedPlugin.package}" failed to load.`)
        )
        continue
      }

      // Add the plugin to the cache entry
      pluginCommandCache[namespacedPlugin.package] = []
      for (const command of plugin.commands) {
        // Add the first word of the command to the cache entry
        pluginCommandCache[namespacedPlugin.package].push(
          command.command.split(' ')[0]
        )
        // Add any aliases of the command to the cache entry
        pluginCommandCache[namespacedPlugin.package].push(
          ...(command.aliases || [])
        )
      }

      // Add these commands to the namespace list
      namespacedCommands.push(...plugin.commands)
    }

    // If we didn't load any commands for this namespace we can skip registering it
    // unless we're loading all namespaces for the help output
    if (namespacedCommands.length === 0 && !showingRootHelp) {
      continue
    }

    // Register all commands we loaded for this namespace
    // If the namespace is @redwoodjs, we don't need to nest the commands under a namespace
    if (namespace === '@redwoodjs') {
      yargs.command(namespacedCommands)
    } else {
      yargs.command({
        command: `${namespace} <command>`,
        describe: `${namespace} plugin commands`,
        builder: (yargs) => {
          yargs.command(namespacedCommands)
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
  } catch (_error) {
    // console.error(error)
    // No need to log this error, it's not critical to cache the plugin commands
  }

  return yargs
}
