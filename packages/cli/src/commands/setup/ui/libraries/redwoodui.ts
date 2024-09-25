import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import type { ListrTaskWrapper } from 'listr2'
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
          const rwuiTailwindConfigContent = (await fetchFromRWUIRepo(
            'web/config/tailwind.config.js',
          )) as string

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
                skip: () => {
                  if (
                    newTailwindConfigContent === projectTailwindConfigContent
                  ) {
                    return 'No changes to write to the TailwindCSS configuration file'
                  }
                  return false
                },
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
          const rwuiIndexCSSContent = (await fetchFromRWUIRepo(
            'web/src/index.css',
          )) as string

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
                skip: () => {
                  if (newIndexCSSContent === projectIndexCSSContent) {
                    return 'No changes to write to the index.css file'
                  }
                  return false
                },
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
              { 'ui/*': ['src/ui/*'] },
              projectTSConfigContent,
            )
          ) {
            return 'Path alias already exists in tsconfig.json'
          } else {
            return false
          }
        },
        task: async (_ctx, task) => {
          const projectTSConfigContent = fs.readFileSync(
            projectWebTSConfigPath,
            'utf-8',
          )
          const newTSConfigContent = addPathAliasToTSConfig(
            task,
            { 'ui/*': ['src/ui/*'] },
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
        task: async (_ctx, task) => {
          // TODO get all packages from web/package.json (filtering out a TBA hardcoded list of packages)
          // that aren't component dependencies, and install them
          // We can hardcode the list of packages to filter out, because we know what they are, because we own RWUI.
          // This list will include, eg, dependencies of RWJS, TailwindCSS, Storybook, etc.

          const rwuiPackageJsonStr = (await fetchFromRWUIRepo(
            'web/package.json',
          )) as string
          const projectPackageJsonStr = fs.readFileSync(
            path.join(rwPaths.web.base, 'package.json'),
            'utf-8',
          )
          let rwuiPackageJson: any
          let projectPackageJson: any
          try {
            rwuiPackageJson = JSON.parse(rwuiPackageJsonStr)
          } catch (e: any) {
            throw new Error(
              `Error parsing RedwoodUI's package.json: ${e.message}`,
            )
          }
          try {
            projectPackageJson = JSON.parse(projectPackageJsonStr)
          } catch (e: any) {
            throw new Error(
              `Error parsing your project's package.json: ${e.message}`,
            )
          }
          // get all non-dev dependencies (currently, RWUI doesn't have any specific dev dependencies)
          const rwuiDeps = Object.keys(rwuiPackageJson.dependencies)
          const projectDeps = Object.keys(projectPackageJson.dependencies)
          const depsToInstall = rwuiDeps.filter(
            (dep) => !projectDeps.includes(dep),
          )

          if (depsToInstall.length === 0) {
            task.skip(
              'No packages to install — all RedwoodUI dependencies are already installed',
            )
            return
          }

          const depsToInstallWithVersions = depsToInstall.map((dep) => {
            return `${dep}@${rwuiPackageJson.dependencies[dep]}`
          })

          task.output = c.info(
            `Installing the following packages — you can remove any later if you don't end up using the components that require them: ${depsToInstallWithVersions.join(', ')}...`,
          )

          await execa('yarn', [
            'workspace',
            'web',
            'add',
            ...depsToInstallWithVersions,
          ])
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Add utility functions used by RedwoodUI',
        task: async (_ctx, task) => {
          // TODO add web/src/lib/utils.{ts/js} to the project

          const projectRWUIUtilsPathTS = path.join(
            rwPaths.web.src,
            'lib/uiUtils.ts',
          )
          const projectRWUIUtilsPathJS = path.join(
            rwPaths.web.src,
            'lib/uiUtils.js',
          )

          let utilsAlreadyInstalled = false
          if (
            fs.existsSync(projectRWUIUtilsPathTS) ||
            fs.existsSync(projectRWUIUtilsPathJS)
          ) {
            utilsAlreadyInstalled = true
          }

          let shouldOverwrite = force ? true : false

          // give user chance to switch overwrite to true
          if (utilsAlreadyInstalled && !shouldOverwrite) {
            shouldOverwrite = await task.prompt({
              type: 'confirm',
              message:
                "Looks like you've already got the RWUI utilities. Do you want to overwrite them? This may be helpful, for example if you've made changes and want to reset them or if we've made updates.",
              initial: false,
            })
          }

          if (utilsAlreadyInstalled && !shouldOverwrite) {
            task.skip("RWUI's utility functions are already installed")
            return
          } else {
            const rwuiUtilsContent = (await fetchFromRWUIRepo(
              'web/src/lib/uiUtils.ts',
            )) as string
            fs.writeFileSync(projectRWUIUtilsPathTS, rwuiUtilsContent)
          }
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Add RedwoodUI components to your project',
        task: async (_ctx, task) => {
          // TODO ahhhh finally the meat and potatoes of the setup.
          // We need to add the components to the project.
          // We can first get a list of all the files in RWUI's web/src/ui directory,
          // and then filter out the ones that are already in the project.
          // Then, we can provide a list of pending files to the user, and ask them if they want to add them. (maybe? meh)

          // top-level components
          const listOfComponentFolders = (await fetchFromRWUIRepo(
            'web/src/ui',
          )) as { name: string; path: string }[]
          // components in sub-directories
          const listOfFormComponentFolders = (await fetchFromRWUIRepo(
            'web/src/ui/formFields',
          )) as { name: string; path: string }[]

          // filter to only directory names that start with a capital letter, as these are the ones that are components
          const componentsAvailable = listOfComponentFolders.filter((val) =>
            /^[A-Z]/.test(val.name),
          )
          const formComponentsAvailable = listOfFormComponentFolders.filter(
            (val) => /^[A-Z]/.test(val.name),
          )

          const selectedComponents = await task.prompt<{
            [key: string]: boolean
          }>({
            type: 'multiselect',
            message:
              'Select the components you want to add to your project (form fields are next; type A to select all):' +
              c.warning(
                '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
              ),
            choices: [
              ...componentsAvailable.map((component) => component.name),
            ],
          })

          const selectedFormComponents = await task.prompt<{
            [key: string]: boolean
          }>({
            type: 'multiselect',
            message:
              'Select the form components you want to add to your project (type A to select all):' +
              c.warning(
                '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
              ),
            choices: [
              ...formComponentsAvailable.map((component) => component.name),
            ],
          })

          console.log('selectedComponents', selectedComponents)
          console.log('selectedFormComponents', selectedFormComponents)

          // const componentsToAdd = Object.keys(selectedComponents).filter(
          //   (key) => selectedComponents[key],
          // )

          // if (componentsToAdd.length === 0) {
          //   task.skip('No components selected to add')
          //   return
          // }

          // for (const componentPath of componentsToAdd) {
          //   const componentContent = await fetchFromRWUIRepo(componentPath)
          //   const componentName = path.basename(componentPath)
          //   const destinationPath = path.join(
          //     rwPaths.web.src,
          //     'ui',
          //     componentName,
          //   )

          //   fs.ensureDirSync(path.dirname(destinationPath))
          //   fs.writeFileSync(destinationPath, componentContent as string)
          // }
        },
      },
      {
        options: { persistentOutput: true },
        title: 'Set up Storybook for RedwoodUI',
        skip: async () => {
          if (force) {
            return false
          }
          // The main file can be either JS or TS, even if the project is TS
          const storybookMainPathJS = path.join(
            rwPaths.web.storybook,
            'main.js',
          )
          const storybookMainPathTS = path.join(
            rwPaths.web.storybook,
            'main.ts',
          )

          let storybookMainPath: string | null = null

          if (fs.existsSync(storybookMainPathJS)) {
            storybookMainPath = storybookMainPathJS
          } else if (fs.existsSync(storybookMainPathTS)) {
            storybookMainPath = storybookMainPathTS
          }

          if (!storybookMainPath) {
            return 'This project is not using Storybook'
          }

          return false
        },
        task: async (_ctx, task) => {
          return task.newListr([
            {
              options: { persistentOutput: true },
              title: 'Add dark mode support to Storybook',
              skip: async () => {
                if (force) {
                  return false
                }
                // The main file can be either JS or TS, even if the project is TS
                const storybookMainPathJS = path.join(
                  rwPaths.web.storybook,
                  'main.js',
                )
                const storybookMainPathTS = path.join(
                  rwPaths.web.storybook,
                  'main.ts',
                )

                let storybookMainPath: string | null = null

                if (fs.existsSync(storybookMainPathJS)) {
                  storybookMainPath = storybookMainPathJS
                } else if (fs.existsSync(storybookMainPathTS)) {
                  storybookMainPath = storybookMainPathTS
                }

                if (!storybookMainPath) {
                  return 'This project is not using Storybook'
                }

                const storybookMainContent = fs.readFileSync(
                  storybookMainPath,
                  'utf-8',
                )

                if (
                  /themes:\s*{\s*light:\s*'light',\s*dark:\s*'dark',\s*}/.test(
                    storybookMainContent,
                  )
                ) {
                  return 'Your Storybook looks like it already has dark mode support'
                } else {
                  return false
                }
              },
              task: async () => {
                throw new Error(
                  'Add dark mode support to Storybook — Not implemented',
                )
              },
            },
            {
              options: { persistentOutput: true },
              title: 'Add children placeholder utility component',
              skip: async () => {
                const storybookPlaceholderComponentPathJSX = path.join(
                  rwPaths.web.storybook,
                  'utilities/ChildrenPlaceholder.jsx',
                )
                const storybookPlaceholderComponentPathTSX = path.join(
                  rwPaths.web.storybook,
                  'utilities/ChildrenPlaceholder.tsx',
                )

                let storybookPlaceholderComponentPath: string | null = null

                if (fs.existsSync(storybookPlaceholderComponentPathJSX)) {
                  storybookPlaceholderComponentPath =
                    storybookPlaceholderComponentPathJSX
                } else if (
                  fs.existsSync(storybookPlaceholderComponentPathTSX)
                ) {
                  storybookPlaceholderComponentPath =
                    storybookPlaceholderComponentPathTSX
                }

                if (storybookPlaceholderComponentPath) {
                  return 'ChildrenPlaceholder component already exists'
                } else {
                  return false
                }
              },
              task: async () => {
                throw new Error(
                  'Add children placeholder utility component — Not implemented',
                )
              },
            },
          ])
        },
      },
    ],
    { rendererOptions: { collapseSubtasks: false }, exitOnError: true }, // exitOnError true for top-level tasks
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
 *
 * @returns string, if path is to file, or array of {name: string, path: string} if path is to a directory
 */
const fetchFromRWUIRepo = async (
  path: string,
): Promise<string | { name: string; path: string }[]> => {
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

  if (Array.isArray(data)) {
    // If data is an array, it's a list of file contents. Return an array of name/path.
    return data.map((item: any) => ({ name: item.name, path: item.path }))
  } else {
    // If data is just an object, it's a file. Decode the encoded content and return it.
    // Content comes in base64 encoded
    // Can confirm this by checking data.encoding === 'base64'
    const fileContent = Buffer.from(data.content, 'base64').toString('utf8')
    return fileContent
  }
}

/**
 * Extracts the necessary data from the TailwindCSS configuration file.
 */
const extractTailwindConfigData = (
  configContent: string,
): {
  darkModeConfig: string | null
  colorsConfig: string | null
  pluginsConfig: string | null
} => {
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

/**
 * TODO: finish implementing this and actually use it.
 * The main challenge, I think, will be that an import name isn't necessarily the same as the package name: eg, `import tailwindDefaults from 'tailwindcss/defaultConfig' is importing from the package `tailwindcss`, not `tailwindcss/defaultConfig`.
 * Maybe the move is to go the other way around — get a list of possible packages to install, and *then* look in the import statements?
 * Basically, we want to replace all (or most?) of the calls to `fs.writeFileSync()` with this function.
 *
 * Rather than blindly adding packages to the project,
 * we'll do it as we add the files that require them.
 *
 * @param rwuiPackageJson Content of the RedwoodUI package.json — this is where we get the package versions. Getting it requires a network call, so requiring it as a parameter such that it can be retrieved only once.
 * @param fileBeingAdded Content of the file being added to the project
 * @param filePath Path of the file being added — this is where it will be written out to
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addFileAndInstallPackages(
  task: ListrTaskWrapper<any, any>,
  rwuiPackageJson: string,
  fileBeingAdded: string,
  filePath: string,
) {
  task.output = 'addFileAndInstallPackages is not yet implemented'
  console.log(rwuiPackageJson, fileBeingAdded, filePath)

  // get the list of dependencies from the file
  // filter out the ones that are already in the project
  // install the remaining ones in the same way we do in the "Install all necessary packages" task
  // write the file with fs.writeFileSync()
}
