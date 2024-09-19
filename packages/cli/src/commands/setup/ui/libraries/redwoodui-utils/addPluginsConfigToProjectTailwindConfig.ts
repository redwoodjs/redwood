import execa from 'execa'

import c from '../../../../../lib/colors'

/**
 * Adds the RedwoodUI plugins TailwindCSS configuration to the project's TailwindCSS configuration.
 *
 * Rather than writing the new config to the file, it will return the new config as a string.
 * This is so that we can iteratively build up the new config and then write it to the file at the end.
 *
 * Regardless of whether it was modified, it will return the new config so that multiple
 * of these transformations can be easily chained together.
 */
const addPluginsConfigToProjectTailwindConfig = async (
  rwuiPluginsConfig: string,
  projectPluginsConfig: string | null,
  projectTailwindConfig: string,
): Promise<string> => {
  let configToReturn = projectTailwindConfig

  // As we add the required plugins to the config, we'll add them here such that
  // we can actually install them at the end.
  const pluginsToInstall: string[] = []

  // First, figure out what plugins RWUI requires
  // Extract the plugin package names from the rwuiPluginsConfig string
  // Match all instances of require('plugin-name') or require("plugin-name")
  const requiredPlugins = (
    rwuiPluginsConfig.match(/require\(['"]([^'"]+)['"]\)/g) || []
  )
    .map((req) => {
      const match = req.match(/['"]([^'"]+)['"]/)
      return match ? match[1] : ''
    })
    .filter(Boolean) // Remove any empty strings resulting from unmatched patterns

  if (projectPluginsConfig === null) {
    // Given that rather than having no plugins config at all by default,
    // the project's TailwindCSS config will generally instead have an empty array.
    // We need to check for both this case and the case where there is no plugins config at all.
    // projectPluginsConfig should be null for both of these cases.

    console.log(
      c.info(
        "Looks like you don't yet have any TailwindCSS plugins configured. Adding all required ones now...",
      ),
    )

    // Check if the project config has a plugins key, ignoring commented lines
    const hasPluginsKey = projectTailwindConfig
      .split('\n')
      .some(
        (line) => !line.trim().startsWith('//') && line.includes('plugins:'),
      )

    if (!hasPluginsKey) {
      // If there's no plugins key, add it at the very bottom of the config object
      const configEndIndex = configToReturn.lastIndexOf('}')
      configToReturn = `${configToReturn.slice(0, configEndIndex)}  plugins: [],\n${configToReturn.slice(configEndIndex)}`
    }

    // Add all required plugins to the config.
    const requiredPluginsWithRequire = requiredPlugins
      .map((plugin) => `require('${plugin}')`)
      .join(', ')

    configToReturn = configToReturn.replace(
      /plugins:\s*\[([^\]]*)\]/,
      `plugins: [${requiredPluginsWithRequire}]`,
    )

    console.log(
      c.success(
        `Added the following TailwindCSS plugins to your config: ${requiredPlugins.join(', ')}`,
      ),
    )

    // We know we're just installing all required plugins.
    requiredPlugins.forEach((plugin) => {
      pluginsToInstall.push(plugin)
    })
  } else {
    // Here, we know that there's *some* plugins included in the project's config.
    // We need to check if it includes all the required plugins.
    // If it doesn't, we'll add the missing plugins to the end of the plugins array.

    console.log(
      c.info(
        "Looks like you've already got some TailwindCSS plugins configured. Checking what's still required...",
      ),
    )

    // Determine which required plugins are missing from the existing plugins
    const missingPlugins = requiredPlugins.filter(
      (plugin) => !projectPluginsConfig.includes(plugin),
    )

    if (missingPlugins.length > 0) {
      // Add the missing plugins to the end of the plugins array via string replacement
      const missingPluginsWithRequire = missingPlugins
        .map((plugin) => `require('${plugin}')`)
        .join(', ')

      // Replace the existing plugins array with the new array that includes the missing plugins
      configToReturn = configToReturn.replace(
        /plugins:\s*\[([^\]]*)\]/,
        (match, p1) => `plugins: [${p1}, ${missingPluginsWithRequire}]`,
      )

      console.log(
        c.success(
          `Added the following TailwindCSS plugins to your config: ${missingPlugins.join(', ')}`,
        ),
      )

      // Add the missing plugins to the pluginsToInstall array
      missingPlugins.forEach((plugin) => {
        pluginsToInstall.push(plugin)
      })
    } else {
      console.log(
        c.success(
          `Your project's TailwindCSS configuration already includes all the required plugins.`,
        ),
      )
    }
  }

  // Now, if we've added any plugins to the config, we need to install them.
  if (pluginsToInstall.length > 0) {
    console.log(
      c.info(
        `Installing the following TailwindCSS plugins that we just added to your config: ${pluginsToInstall.join(
          ', ',
        )}...`,
      ),
    )
    // TODO: We aren't currently checking for any version numbers, because our plugins config
    // is very light and we don't expect any versioning issues with the ones we're using.
    // If we ever need to add version numbers, we'll need to update this to handle that
    // by grabbing them from the RWUI web/package.json file.
    try {
      await execa('yarn', ['workspace', 'web', 'add', ...pluginsToInstall])
      console.log(c.success(`Successfully installed the TailwindCSS plugins.`))
    } catch {
      console.error(
        c.error(
          `There was an error installing the TailwindCSS plugins. Please try running the command manually: yarn workspace web add ${pluginsToInstall.join(
            ' ',
          )}`,
        ),
      )
    }
  }

  return configToReturn
}

export default addPluginsConfigToProjectTailwindConfig
