import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import type { Argv } from 'yargs'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'

interface RedwoodUIYargsOptions {
  force: boolean
  install: boolean
}

export const command = 'redwoodui'
export const aliases = ['rwui']
export const description = 'Set up RedwoodUI'
export function builder(
  yargs: Argv<RedwoodUIYargsOptions>,
): Argv<RedwoodUIYargsOptions> {
  return yargs
    .option('force', {
      alias: 'f',
      default: false,
      description:
        'Overwrite all existing configuration (NOTE: this will also reset your TailwindCSS configuration!)',
      type: 'boolean',
    })
    .option('install', {
      alias: 'i',
      default: true,
      description: 'Install packages',
      type: 'boolean',
    })
}

export const handler = async ({ force, install }: RedwoodUIYargsOptions) => {
  recordTelemetryAttributes({
    command: 'setup ui redwoodui',
    force,
    install,
  })
  const rwPaths = getPaths()

  const projectTailwindConfigPath = path.join(
    rwPaths.web.config,
    'tailwind.config.js',
  )
  const projectIndexCSSPath = path.join(rwPaths.web.src, 'index.css')

  const tasks = new Listr([
    {
      title: 'Setting up TailwindCSS...',
      // first, check that Tailwind has been setup.
      // there's already a setup command for this,
      // so if it's not setup, we can just run that command.
      skip: async () => {
        // if force is true, never skip
        if (force) {
          return false
        }

        // if the config already exists, don't need to set up, so skip
        if (
          fs.existsSync(projectTailwindConfigPath) &&
          fs.existsSync(projectIndexCSSPath)
        ) {
          return 'TailwindCSS is already set up.'
        } else {
          return false
        }
      },
      task: async () => {
        const argsToInclude: string[] = [force && '-f', install && '-i'].filter(
          (item) => item != false,
        )
        await execa(
          'yarn',
          ['rw', 'setup', 'ui', 'tailwindcss', ...argsToInclude],
          // this is needed so that the output is shown in the terminal.
          // TODO: still, it's not perfect, because the output is shown below the others
          // and seems to be swallowing, for example, part of the suggested extensions message.
          { stdio: 'inherit' },
        )
      },
    },
    {
      title: "Adding RedwoodUI's TailwindCSS configuration...",
      task: async () => {
        const rwuiTailwindConfigContent = await fetchFromRWUIRepo(
          'web/config/tailwind.config.js',
        )

        const projectTailwindConfigContent = fs.readFileSync(
          projectTailwindConfigPath,
          'utf-8',
        )

        const rwuiTailwindConfigData = extractTailwindConfigData(
          rwuiTailwindConfigContent,
        )
        const projectTailwindConfigData = extractTailwindConfigData(
          projectTailwindConfigContent,
        )

        const newTailwindConfigContent =
          addDarkModeConfigToProjectTailwindConfig(
            // we can safely cast to string because we know it's not null — if it is, something went wrong
            rwuiTailwindConfigData.darkModeConfig as string,
            projectTailwindConfigData.darkModeConfig,
            projectTailwindConfigContent,
          )

        // next, add the colors config
        // then, add the plugins config

        // After all transformations, write the new config to the file
        fs.writeFileSync(projectTailwindConfigPath, newTailwindConfigContent)
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e: any) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

const fetchFromRWUIRepo = async (path: string) => {
  const owner = 'arimendelow'
  const repo = 'RedwoodUI'
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  // Perform the fetch request
  const res = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      // https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2022-11-28#supported-api-versions
      'X-GitHub-Api-Version': '2022-11-28',
      // https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28#user-agent
      'User-Agent': 'RedwoodUI Setup',
    },
  })

  if (!res.ok) {
    throw new Error(`Error fetching file from repo: ${res.statusText}`)
  }

  const data = await res.json()

  // Content comes in base64 encoded
  // Can confirm this by checking data.encoding === 'base64'
  const fileContent = Buffer.from(data.content, 'base64').toString('utf8')
  return fileContent
}

interface ImportantTailwindConfigData {
  darkModeConfig: string | null
  colorsConfig: string | null
  pluginsConfig: string | null
}

/**
 * Extracts the necessary data from the TailwindCSS configuration file.
 */
const extractTailwindConfigData = (
  configContent: string,
): ImportantTailwindConfigData => {
  const darkModeMatch = configContent.match(/darkMode:\s*([^\n]+),/)
  const darkModeConfig = darkModeMatch ? darkModeMatch[1].trim() : null

  const colorsMatch = configContent.match(/colors:\s*({[^}]+})/s)
  const colorsConfig = colorsMatch ? colorsMatch[1].trim() : null

  const pluginsMatch = configContent.match(/plugins:\s*(\[.+\])/s)
  const pluginsConfig = pluginsMatch ? pluginsMatch[1].trim() : null

  return {
    darkModeConfig,
    colorsConfig,
    pluginsConfig,
  }
}

/**
 * Adds the RedwoodUI TailwindCSS configuration to the project's TailwindCSS configuration.
 * If the project doesn't have a darkMode config, it will add it.
 * If the project does have a darkMode config, it will check if it matches the RedwoodUI darkMode config.
 * If it doesn't match, it will print a warning that the user should check their darkMode config.
 *
 * Rather than writing the new config to the file, it will return the new config as a string.
 * This is so that we can iteratively build up the new config and then write it to the file at the end.
 *
 * Regardless of whether it was modified, it will return the new config so that multiple
 * of these transformations can be easily chained together.
 */
const addDarkModeConfigToProjectTailwindConfig = (
  rwuiDarkModeConfig: string,
  projectDarkModeConfig: string | null,
  projectTailwindConfig: string,
): string => {
  // if the project doesn't have a darkMode config, add it
  if (!projectDarkModeConfig) {
    // add the rwuiDarkModeConfig to the projectTailwindConfig
    const newConfig = projectTailwindConfig.replace(
      /module.exports = {/,
      `module.exports = {\n  darkMode: ${rwuiDarkModeConfig},`,
    )
    console.log(
      c.success(
        `Added RedwoodUI's darkMode configuration to your project's TailwindCSS configuration.`,
      ),
    )
    return newConfig
  }

  // if the project does have a darkMode config, check if it matches the rwuiDarkModeConfig
  // if it doesn't match, print a warning that the user should check their darkMode config
  // and possibly update it to match the rwuiDarkModeConfig
  if (projectDarkModeConfig !== rwuiDarkModeConfig) {
    console.warn(
      c.warning(
        `Warning: Your project's TailwindCSS configuration has a different darkMode setting than RedwoodUI's.\nPlease check your darkMode setting and ensure it matches RedwoodUI's.\n\nRedwoodUI darkMode setting: ${rwuiDarkModeConfig}\nYour project's darkMode setting: ${projectDarkModeConfig}\n\nMore info here: https://tailwindcss.com/docs/dark-mode#customizing-the-selector`,
      ),
    )
  } else {
    console.log(
      c.success(
        `Your project's TailwindCSS configuration already has the correct darkMode setting.`,
      ),
    )
  }
  return projectTailwindConfig
}
