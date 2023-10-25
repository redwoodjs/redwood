import fs from 'fs'
import path from 'path'

import type { JsonMap } from '@iarna/toml'
import toml from '@iarna/toml'

import {
  findUp,
  getConfigPath,
  getConfig,
  resolveFile,
} from '@redwoodjs/project-config'

import { colors } from './colors'
import { getPaths } from './paths'

export const getGraphqlPath = () => {
  return resolveFile(path.join(getPaths().api.functions, 'graphql'))
}

export const graphFunctionDoesExist = () => {
  const graphqlPath = getGraphqlPath()
  return graphqlPath && fs.existsSync(graphqlPath)
}

export const isTypeScriptProject = () => {
  const paths = getPaths()
  return (
    fs.existsSync(path.join(paths.web.base, 'tsconfig.json')) ||
    fs.existsSync(path.join(paths.api.base, 'tsconfig.json'))
  )
}

export const getInstalledRedwoodVersion = () => {
  try {
    const packageJson = require('../../package.json')
    return packageJson.version
  } catch (e) {
    console.error(colors.error('Could not find installed redwood version'))
    process.exit(1)
  }
}

/**
 * Updates the project's redwood.toml file to include the specified packages plugin
 *
 * Uses toml parsing to determine if the plugin is already included in the file and
 * only adds it if it is not.
 *
 * Writes the updated config to the file system by appending strings, not stringify-ing the toml.
 */
export const updateTomlConfig = (packageName: string) => {
  const redwoodTomlPath = getConfigPath()
  const originalTomlContent = fs.readFileSync(redwoodTomlPath, 'utf-8')

  let tomlToAppend = {} as JsonMap

  const config = getConfig(redwoodTomlPath) // ?

  const cliSection = config.experimental?.cli // ?

  if (!cliSection) {
    tomlToAppend = {
      experimental: {
        cli: {
          autoInstall: true,
          plugins: [{ package: packageName, enabled: true }],
        },
      },
    }
  } else if (cliSection.plugins) {
    const packageExists = cliSection.plugins.some(
      (plugin) => plugin.package === packageName
    )

    if (!packageExists) {
      tomlToAppend = {
        experimental: {
          cli: {
            plugins: [{ package: packageName, enabled: true }],
          },
        },
      }
    }
  } else {
    tomlToAppend = {
      experimental: {
        cli: {
          plugins: [{ package: packageName, enabled: true }],
        },
      },
    }
  }

  const newConfig = originalTomlContent + '\n' + toml.stringify(tomlToAppend) // ?

  return fs.writeFileSync(redwoodTomlPath, newConfig, 'utf-8')
}

export const updateTomlConfigTask = (packageName: string) => {
  return {
    title: `Updating redwood.toml to configure ${packageName} ...`,
    task: () => {
      updateTomlConfig(packageName)
    },
  }
}

export const addEnvVarTask = (
  name: string,
  value: string,
  comment: string,
  overwrite = false
) => {
  return {
    title: `Adding ${name} var to .env...`,
    task: () => {
      addEnvVar(name, value, comment, overwrite)
    },
  }
}

export const addEnvVar = (
  name: string,
  value: string,
  comment: string,
  overwrite = false
) => {
  const envPath = path.join(getPaths().base, '.env')
  const content = [comment && `# ${comment}`, `${name}=${value}`, ''].flat()
  let envFile = ''

  if (fs.existsSync(envPath)) {
    envFile = fs.readFileSync(envPath).toString()
    const lines = envFile.split('\n')

    // Check if the variable already exists
    const existingIndex = lines.findIndex((line) => {
      const trimmedLine = line.trim()
      return (
        trimmedLine.startsWith(`${name}=`) ||
        trimmedLine.startsWith(`#${name}=`)
      )
    })

    if (existingIndex !== -1) {
      // Variable already exists, check if overwrite is true
      if (overwrite) {
        // Update the existing line with the new value
        const existingComment = [content[0]]
        lines[existingIndex] = `${existingComment}\n${name}=${value}`
        envFile = lines.join('\n')
      }
      // If overwrite is false, do nothing (leave the file unchanged)
    } else {
      // Variable doesn't exist, add it
      envFile += '\n' + content.join('\n')
    }
  } else {
    envFile = content.join('\n')
  }

  return fs.writeFileSync(envPath, envFile)
}

/**
 * This sets the `RWJS_CWD` env var to the redwood project directory. This is typically required for internal
 * redwood packages to work correctly. For example, `@redwoodjs/project-config` uses this when reading config
 * or paths.
 *
 * @param cwd Explicitly set the redwood cwd. If not set, we'll try to determine it automatically. You likely
 * only want to set this based on some specific input, like a CLI flag.
 */
export const setRedwoodCWD = (cwd?: string) => {
  // Get the existing `cwd` from the `RWJS_CWD` env var, if it exists.
  cwd ??= process.env.RWJS_CWD

  if (cwd) {
    // `cwd` was specifically passed in or the `RWJS_CWD` env var. In this case,
    // we don't want to find up for a `redwood.toml` file. The `redwood.toml` should just be in that directory.
    if (!fs.existsSync(path.join(cwd, 'redwood.toml'))) {
      throw new Error(`Couldn't find a "redwood.toml" file in ${cwd}`)
    }
  } else {
    // `cwd` wasn't set. Odds are they're in a Redwood project,
    // but they could be in ./api or ./web, so we have to find up to be sure.
    const redwoodTOMLPath = findUp('redwood.toml', process.cwd())
    if (!redwoodTOMLPath) {
      throw new Error(
        `Couldn't find up a "redwood.toml" file from ${process.cwd()}`
      )
    }
    if (redwoodTOMLPath) {
      cwd = path.dirname(redwoodTOMLPath)
    }
  }

  process.env.RWJS_CWD = cwd
}
