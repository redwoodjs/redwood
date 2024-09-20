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
import addLayerToIndexCSS from './redwoodui-utils/addLayerToIndexCSS'
import addPathAliasToTSConfig, {
  hasPathAliasInTSConfig,
} from './redwoodui-utils/addPathAliasToTSConfig'
import addPluginsConfigToProjectTailwindConfig from './redwoodui-utils/addPluginsConfigToProjectTailwindConfig'

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

  const projectWebTSConfigPath = path.join(rwPaths.web.base, 'tsconfig.json')

  const tasks = new Listr(
    [
      {
        options: { persistentOutput: true },
        title: 'Setting up TailwindCSS',
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
            return 'TailwindCSS is already set up'
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
                title: "Add RedwoodUI's darkMode configuration",
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
                title: "Add RedwoodUI's color theme configuration",
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
                title: "Add RedwoodUI's plugins configuration",
                task: async (_ctx, task) => {
                  newTailwindConfigContent =
                    await addPluginsConfigToProjectTailwindConfig(
                      task,
                      // we can safely cast to string because we know it's not null — if it is, something went wrong
                      rwuiTailwindConfigData.pluginsConfig as string,
                      projectTailwindConfigData.pluginsConfig,
                      newTailwindConfigContent,
                    )
                },
              },
              {
                options: { persistentOutput: true },
                title: 'Write out new TailwindCSS configuration',
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
        },
      },
      {
        title: "Adding RedwoodUI's classes to your project's index.css",
        task: async (_ctx, task) => {
          const rwuiIndexCSSContent =
            await fetchFromRWUIRepo('web/src/index.css')

          const projectIndexCSSContent = fs.readFileSync(
            projectIndexCSSPath,
            'utf-8',
          )

          const rwuiCSSLayers = extractCSSLayers(rwuiIndexCSSContent)
          const projectCSSLayers = extractCSSLayers(projectIndexCSSContent)

          let newIndexCSSContent = projectIndexCSSContent

          return task.newListr(
            [
              {
                options: { persistentOutput: true },
                title: 'Add base layer',
                task: async (_ctx, task) => {
                  newIndexCSSContent = addLayerToIndexCSS(
                    task,
                    'base',
                    // we can safely cast to string because we know it's not null — if it is, something went wrong
                    rwuiCSSLayers.base as string,
                    projectCSSLayers.base,
                    newIndexCSSContent,
                  )
                },
              },
              {
                options: { persistentOutput: true },
                title: 'Add components layer',
                task: async (_ctx, task) => {
                  newIndexCSSContent = addLayerToIndexCSS(
                    task,
                    'components',
                    // we can safely cast to string because we know it's not null — if it is, something went wrong
                    rwuiCSSLayers.components as string,
                    projectCSSLayers.components,
                    newIndexCSSContent,
                  )
                },
              },
              {
                options: { persistentOutput: true },
                title: 'Write out new index.css',
                task: async () => {
                  // After all transformations, write the new config to the file
                  fs.writeFileSync(projectIndexCSSPath, newIndexCSSContent)
                },
              },
            ],
            {
              rendererOptions: { collapseSubtasks: false },
              exitOnError: false,
            },
          )
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Add path alias to web/tsconfig.json',
        skip: async () => {
          // if force is true, never skip
          if (force) {
            return false
          }

          const projectTSConfigContent = fs.readFileSync(
            projectWebTSConfigPath,
            'utf-8',
          )
          if (
            hasPathAliasInTSConfig(
              { 'ui/*': ['./src/ui/*'] },
              projectTSConfigContent,
            )
          ) {
            return 'Path alias already exists in tsconfig.json'
          } else {
            return false
          }
        },
        task: async () => {
          // TODO add "ui/*": ["src/ui/*"] to the end of the paths object in the tsconfig.json file
          // throw new Error(
          //   'Add path alias to web/tsconfig.json — Not implemented',
          // )
          const projectTSConfigContent = fs.readFileSync(
            projectWebTSConfigPath,
            'utf-8',
          )
          console.log(projectTSConfigContent)
          const newTSConfigContent = addPathAliasToTSConfig(
            { 'ui/*': ['./src/ui/*'] },
            projectTSConfigContent,
          )

          // After all transformations, write the new config to the file
          fs.writeFileSync(projectWebTSConfigPath, newTSConfigContent)
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Install all necessary packages',
        skip: async () => {
          // if force is true, never skip
          if (force) {
            return false
          }
          // TODO we can check ourselves if the packages are installed and skip if they are,
          // but because Yarn does this for us, it's low priority
          return false
        },
        task: async () => {
          // TODO get all packages from web/package.json (filtering out a TBA hardcoded list of packages)
          // that aren't component dependencies, and install them
          // We can hardcode the list of packages to filter out, because we know what they are, because we own RWUI.
          // This list will include, eg, dependencies of RWJS, TailwindCSS, Storybook, etc.
          throw new Error('Install all necessary packages — Not implemented')
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Add utility functions used by RedwoodUI',
        task: async () => {
          // TODO add web/src/lib/{utils.ts + types.d.ts} to the project
          // Need to figure out how to best handle situations where the files already exist.
          throw new Error(
            'Add utility functions used by RedwoodUI — Not implemented',
          )
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Add RedwoodUI components to your project',
        task: async () => {
          // TODO ahhhh finally the meat and potatoes of the setup.
          // We need to add the components to the project.
          // We can first get a list of all the files in RWUI's web/src/ui directory,
          // and then filter out the ones that are already in the project.
          // Then, we can provide a list of pending files to the user, and ask them if they want to add them. (maybe? meh)
          throw new Error(
            'Add RedwoodUI components to your project — Not implemented',
          )
        },
      },
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

/**
 * Fetches a file from the RedwoodUI repo.
 * Uses the GitHub REST API to fetch the file, rather than Octokit,
 * because Octokit both adds a bunch of overhead
 * and was causing ESM/CJS related build issues that I didn't want to deal with :)
 */
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

interface ImportantCSSLayers {
  base: string | null
  components: string | null
}

/**
 * Extracts the necessary data from a CSS file.
 */
const extractCSSLayers = (cssContent: string): ImportantCSSLayers => {
  const base = extractLayerContent(cssContent, 'base')
  const components = extractLayerContent(cssContent, 'components')
  return {
    base,
    components,
  }
}

/**
 * Extracts the content of a specific layer from a CSS file.
 */
function extractLayerContent(css: string, layerName: string): string | null {
  const layerRegex = new RegExp(`@layer ${layerName}\\s*{`, 'g')
  const match = layerRegex.exec(css)
  if (!match) {
    return null
  }

  const startIndex = match.index + match[0].length
  let braceCount = 1
  let endIndex = startIndex

  while (braceCount > 0 && endIndex < css.length) {
    if (css[endIndex] === '{') {
      braceCount++
    }
    if (css[endIndex] === '}') {
      braceCount--
    }
    endIndex++
  }

  const content = css.slice(startIndex, endIndex - 1).trim()
  return content
}
