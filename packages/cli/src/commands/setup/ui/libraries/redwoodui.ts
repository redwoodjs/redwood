import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import { Listr } from 'listr2'
import type { Argv } from 'yargs'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'

import addColorsConfigToProjectTailwindConfig from './redwoodui-utils/addColorsConfigToProjectTailwindConfig'
import addDarkModeConfigToProjectTailwindConfig from './redwoodui-utils/addDarkModeConfigToProjectTailwindConfig'

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

  const tasks = new Listr(
    [
      {
        options: { persistentOutput: true },
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
          const argsToInclude: string[] = [
            force && '-f',
            install && '-i',
          ].filter((item) => item != false)
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
        options: { persistentOutput: true },
        title: 'Merging your TailwindCSS configuration with that of RedwoodUI',
        task: async (_ctx, task) => {
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

          let newTailwindConfigContent = projectTailwindConfigContent

          return task.newListr(
            [
              {
                options: { persistentOutput: true },
                title: "Adding RedwoodUI's darkMode configuration",
                task: async (_ctx, task) => {
                  newTailwindConfigContent =
                    addDarkModeConfigToProjectTailwindConfig(
                      task,
                      // we can safely cast to string because we know it's not null — if it is, something went wrong
                      rwuiTailwindConfigData.darkModeConfig as string,
                      projectTailwindConfigData.darkModeConfig,
                      newTailwindConfigContent,
                    )
                },
              },
              {
                options: { persistentOutput: true },
                title: "Adding RedwoodUI's color theme configuration",
                task: async (_ctx, task) => {
                  newTailwindConfigContent =
                    addColorsConfigToProjectTailwindConfig(
                      task,
                      // we can safely cast to string because we know it's not null — if it is, something went wrong
                      rwuiTailwindConfigData.colorsConfig as string,
                      projectTailwindConfigData.colorsConfig,
                      newTailwindConfigContent,
                    )
                },
              },
              {
                options: { persistentOutput: true },
                title: 'Writing out new TailwindCSS configuration',
                task: async () => {
                  // After all transformations, write the new config to the file
                  fs.writeFileSync(
                    projectTailwindConfigPath,
                    newTailwindConfigContent,
                  )
                },
              },
            ],
            {
              rendererOptions: { collapseSubtasks: false },
              exitOnError: false,
            },
          )

          // // then, add the plugins config
          // newTailwindConfigContent =
          //   await addPluginsConfigToProjectTailwindConfig(
          //     // we can safely cast to string because we know it's not null — if it is, something went wrong
          //     rwuiTailwindConfigData.pluginsConfig as string,
          //     projectTailwindConfigData.pluginsConfig,
          //     newTailwindConfigContent,
          //   )
        },
      },
      // {
      //   title: "Adding RedwoodUI's CSS rules to index.css",
      //   task: async () => {
      //     const rwuiIndexCSSContent = await fetchFromRWUIRepo('web/src/index.css')
      //     const projectIndexCSSContent = fs.readFileSync(
      //       projectIndexCSSPath,
      //       'utf-8',
      //     )
      //     console.log('rwui index css content', rwuiIndexCSSContent)
      //     console.log('project index css content', projectIndexCSSContent)
      //   },
      // },
    ],
    { rendererOptions: { collapseSubtasks: false }, exitOnError: false },
  )

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

  // Look specifically for the colors object under the theme.extend object
  const colorsMatch = configContent.match(
    /theme:\s*{\s*extend:\s*{\s*colors:\s*({[^}]+})/s,
  )
  const colorsConfig = colorsMatch ? colorsMatch[1].trim() : null

  const pluginsMatch = configContent.match(/plugins:\s*(\[.+\])/s)
  const pluginsConfig = pluginsMatch ? pluginsMatch[1].trim() : null

  return {
    darkModeConfig,
    colorsConfig,
    pluginsConfig,
  }
}
