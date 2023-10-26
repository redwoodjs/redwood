import fs from 'fs'
import path from 'path'

import type { JsonMap } from '@iarna/toml'
import toml from '@iarna/toml'
import dotenv from 'dotenv'

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

  const config = getConfig(redwoodTomlPath)

  const cliSection = config.experimental?.cli

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

  const newConfig = originalTomlContent + '\n' + toml.stringify(tomlToAppend)

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

export const addEnvVarTask = (name: string, value: string, comment: string) => {
  return {
    title: `Adding ${name} var to .env...`,
    task: () => {
      addEnvVar(name, value, comment)
    },
  }
}

export const addEnvVar = (name: string, value: string, comment: string) => {
  const envPath = path.join(getPaths().base, '.env')
  let envFile = ''
  const newEnvironmentVariable = [
    comment && `# ${comment}`,
    `${name} = ${value}`,
    '',
  ]
    .flat()
    .join('\n')

  if (fs.existsSync(envPath)) {
    envFile = fs.readFileSync(envPath).toString()
    const existingEnvVars = dotenv.parse(envFile)

    if (existingEnvVars[name] && existingEnvVars[name] === value) {
      return envFile
    }

    if (existingEnvVars[name]) {
      const p = [
        `# Note: The existing environment variable ${name} was not overwritten. Uncomment to use its new value.`,
        comment && `# ${comment}`,
        `# ${name} = ${value}`,
        '',
      ]
        .flat()
        .join('\n')
      envFile += '\n' + p
    } else {
      envFile += '\n' + newEnvironmentVariable
    }
  } else {
    envFile = newEnvironmentVariable
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
