import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import type {
  ListrGetRendererTaskOptions,
  ListrTask,
  ListrTaskWrapper,
} from 'listr2'
import { Listr } from 'listr2'
import type { Argv } from 'yargs'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import type { Paths } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'

import addColorsConfigToProjectTailwindConfig from './redwoodui-utils/addColorsConfigToProjectTailwindConfig'
import addDarkModeConfigToProjectTailwindConfig from './redwoodui-utils/addDarkModeConfigToProjectTailwindConfig'
import addLayerToIndexCSS from './redwoodui-utils/addLayerToIndexCSS'
import addPluginsConfigToProjectTailwindConfig from './redwoodui-utils/addPluginsConfigToProjectTailwindConfig'

// TODO: add options here, probably at least `force`
// interface RedwoodUIYargsOptions {
// }

export const command = 'redwoodui'
export const aliases = ['rwui']
export const description = 'Set up RedwoodUI'
export function builder(yargs: Argv): Argv {
  // TODO add options
  return yargs
  // .option('force', {
  //   alias: 'f',
  //   default: false,
  //   description:
  //     'Overwrite all existing configuration (NOTE: this will also reset your TailwindCSS configuration!)',
  //   type: 'boolean',
  // })
}

export const handler = async () => {
  recordTelemetryAttributes({
    command: 'setup ui redwoodui',
  })
  const installHandler = new RWUIInstallHandler()

  try {
    await installHandler.getAllTasks().run()
  } catch (e: any) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

class RWUIInstallHandler {
  rwPaths!: Paths

  projectTailwindConfigPath!: string
  projectIndexCSSPath!: string

  storybookMainPath: string | null = null

  /**
   * The contents of the package.json file from the RedwoodUI repo's web workspace
   * (as that's the only one we care about as a source of truth for dependencies)
   */
  rwuiPackageJson: any

  defaultTaskOptions: ListrGetRendererTaskOptions<any> = {
    persistentOutput: true,
  }

  constructor() {
    this.initGlobalPaths()
    this.initStorybookInfo()
    this.initRemoteFileContents()
  }

  /**
   * A place to house the initialization of paths that don't make sense being initialized elsewhere
   */
  initGlobalPaths() {
    this.rwPaths = getPaths()

    this.projectTailwindConfigPath = path.join(
      this.rwPaths.web.config,
      'tailwind.config.js',
    )
    this.projectIndexCSSPath = path.join(this.rwPaths.web.src, 'index.css')
  }

  /**
   * A place to house the initialization of Storybook-related info
   */
  initStorybookInfo() {
    // The main file can be either JS or TS, even if the project is TS
    const storybookMainPathJS = path.join(this.rwPaths.web.storybook, 'main.js')
    const storybookMainPathTS = path.join(this.rwPaths.web.storybook, 'main.ts')

    if (fs.existsSync(storybookMainPathJS)) {
      this.storybookMainPath = storybookMainPathJS
    } else if (fs.existsSync(storybookMainPathTS)) {
      this.storybookMainPath = storybookMainPathTS
    }
  }

  /**
   * A place to house the initialization of remote file contents that is accessed between more than one task
   * so that we don't need to fetch the same file multiple times
   */
  async initRemoteFileContents() {
    const rwuiPackageJsonStr = (await fetchFromRWUIRepo(
      'web/package.json',
    )) as string
    try {
      this.rwuiPackageJson = JSON.parse(rwuiPackageJsonStr)
    } catch (e: any) {
      throw new Error(`Error parsing RedwoodUI's package.json: ${e.message}`)
    }
  }

  get usingStorybook() {
    return !!this.storybookMainPath
  }

  /**
   * Checks if TailwindCSS is set up, calling the setup CLI if it isn't
   */
  getSetupTWTask(): ListrTask {
    return {
      options: this.defaultTaskOptions,
      title: 'Setting up TailwindCSS',
      skip: async () => {
        // if the config already exists, don't need to set up, so skip
        if (
          fs.existsSync(this.projectTailwindConfigPath) &&
          fs.existsSync(this.projectIndexCSSPath)
        ) {
          return 'TailwindCSS is already set up'
        } else {
          return false
        }
      },
      task: async () => {
        // TODO once we add args to the command, we'll likely want to pass any that map over through
        // const argsToInclude: string[] = [
        //   force && '-f',
        // ].filter((item) => item != false)
        await execa(
          'yarn',
          ['rw', 'setup', 'ui', 'tailwindcss'],
          // this is needed so that the output is shown in the terminal.
          // TODO: still, it's not perfect, because the output is shown below the others
          // and seems to be swallowing, for example, part of the suggested extensions message.
          { stdio: 'inherit' },
        )
      },
    }
  }

  getConfigTWTask(): ListrTask {
    return {
      options: this.defaultTaskOptions,
      title: 'Merging your TailwindCSS configuration with that of RedwoodUI',
      task: async (_ctx, task) => {
        const rwuiTailwindConfigContent = (await fetchFromRWUIRepo(
          'web/config/tailwind.config.js',
        )) as string

        const projectTailwindConfigContent = fs.readFileSync(
          this.projectTailwindConfigPath,
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
                if (newTailwindConfigContent === projectTailwindConfigContent) {
                  return 'No changes to write to the TailwindCSS configuration file'
                }
                return false
              },
              task: async () => {
                // After all transformations, write the new config to the file
                fs.writeFileSync(
                  this.projectTailwindConfigPath,
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
    }
  }

  getAddCSSTask(): ListrTask {
    return {
      title: "Adding RedwoodUI's classes to your project's index.css",
      task: async (_ctx, task) => {
        const rwuiIndexCSSContent = (await fetchFromRWUIRepo(
          'web/src/index.css',
        )) as string

        const projectIndexCSSContent = fs.readFileSync(
          this.projectIndexCSSPath,
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
                fs.writeFileSync(this.projectIndexCSSPath, newIndexCSSContent)
              },
            },
          ],
          {
            rendererOptions: { collapseSubtasks: false },
            exitOnError: false,
          },
        )
      },
    }
  }

  getAddUtilityFunctionsTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Add utility functions used by RedwoodUI',
      task: async (_ctx, task) => {
        const projectRWUIUtilsPathTS = path.join(
          this.rwPaths.web.src,
          'lib/uiUtils.ts',
        )
        const projectRWUIUtilsPathJS = path.join(
          this.rwPaths.web.src,
          'lib/uiUtils.js',
        )

        let utilsAlreadyInstalled = false
        if (
          fs.existsSync(projectRWUIUtilsPathTS) ||
          fs.existsSync(projectRWUIUtilsPathJS)
        ) {
          utilsAlreadyInstalled = true
        }

        let shouldOverwrite = false

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

          this._addFileAndInstallPackages(
            task,
            rwuiUtilsContent,
            projectRWUIUtilsPathTS,
          )
        }
      },
    }
  }

  getAddComponentsTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Add RedwoodUI components to your project',
      task: async (_ctx, task) => {
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
          (val) => /^[A-Z]/.test(val.name) && val.name !== 'InputFieldWrapper', // InputFieldWrapper is a shared dependency, and not a regular component
        )

        const selectedComponents = await task.prompt<string[]>({
          type: 'multiselect',
          message:
            'Select the components you want to add to your project (form fields are next):' +
            c.warning(
              '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
            ),
          hint: 'Use the arrow keys to navigate, space to select, and A to select all',
          choices: [...componentsAvailable.map((component) => component.name)],
        })

        const selectedFormComponents = await task.prompt<string[]>({
          type: 'multiselect',
          message:
            'Select the form components you want to add to your project (type A to select all):' +
            c.warning(
              '\n🚨 All selected components will be overwritten if they already exist.\nMake sure to back up any important changes before proceeding.\n',
            ),
          hint: 'Use the arrow keys to navigate, space to select, and A to select all',
          choices: [
            ...formComponentsAvailable.map((component) => component.name),
          ],
        })

        return task.newListr([
          ...selectedComponents.map(
            (componentToInstall): ListrTask => ({
              options: { persistentOutput: false },
              title: `Install component: ${componentToInstall}`,
              task: async (_ctx, task) => {
                await this._installComponent(task, componentToInstall)
              },
            }),
          ),
          ...selectedFormComponents.map(
            (formComponentToInstall): ListrTask => ({
              options: { persistentOutput: false },
              title: `Install form component: ${formComponentToInstall}`,
              task: async (_ctx, task) => {
                await this._installComponent(
                  task,
                  formComponentToInstall,
                  'form',
                )
              },
            }),
          ),
          ...(selectedFormComponents.length > 0
            ? [
                {
                  options: { persistentOutput: true },
                  title: 'Install shared dependencies for form components',
                  task: async () => {
                    // Placeholder for installing shared dependencies for form components
                    throw new Error(
                      'Install shared dependencies for form components — Not implemented',
                    )
                  },
                },
              ]
            : []),
        ])
      },
    }
  }

  getSetUpStorybookTask(): ListrTask {
    return {
      options: { persistentOutput: true },
      title: 'Set up Storybook for RedwoodUI',
      skip: async () => {
        if (!this.usingStorybook) {
          return "This project is not using Storybook. If you do wish to use Storybook, you can set it up with `yarn redwood storybook`\nNote that without Storybook set up, we won't add component stories to your project."
        }

        return false
      },
      task: async (_ctx, task) => {
        return task.newListr([
          {
            options: { persistentOutput: true },
            title: 'Add dark mode support to Storybook',
            skip: async () => {
              const storybookMainContent = fs.readFileSync(
                // We know the user is using Storybook because we checked above
                this.storybookMainPath as string,
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
            title: 'Add story utility components',
            skip: async () => {
              // TODO this hardcodes the possible utility components. Instead,
              // we should fetch the list of utility components from the RWUI repo.

              // in the user's project can be either JSX or TSX, but in RWUI it's always TSX
              const childrenPlaceholderComponentPathJSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/ChildrenPlaceholder.jsx',
              )
              const childrenPlaceholderComponentPathTSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/ChildrenPlaceholder.tsx',
              )
              const rwjsLogoPathJSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/RedwoodJSLogo.jsx',
              )
              const rwjsLogoPathTSX = path.join(
                this.rwPaths.web.src,
                'ui/storyUtils/RedwoodJSLogo.tsx',
              )

              let rwjsLogoPath: string | null = null
              if (fs.existsSync(rwjsLogoPathJSX)) {
                rwjsLogoPath = rwjsLogoPathJSX
              } else if (fs.existsSync(rwjsLogoPathTSX)) {
                rwjsLogoPath = rwjsLogoPathTSX
              }

              let childrenPlaceholderComponentPath: string | null = null
              if (fs.existsSync(childrenPlaceholderComponentPathJSX)) {
                childrenPlaceholderComponentPath =
                  childrenPlaceholderComponentPathJSX
              } else if (fs.existsSync(childrenPlaceholderComponentPathTSX)) {
                childrenPlaceholderComponentPath =
                  childrenPlaceholderComponentPathTSX
              }

              if (childrenPlaceholderComponentPath && rwjsLogoPath) {
                return 'ChildrenPlaceholder components already exist'
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
    }
  }

  getAllTasks() {
    return new Listr(
      [
        this.getSetupTWTask(),
        this.getConfigTWTask(),
        this.getAddCSSTask(),
        this.getSetUpStorybookTask(),
        this.getAddUtilityFunctionsTask(),
        this.getAddComponentsTask(),
      ],
      { rendererOptions: { collapseSubtasks: false }, exitOnError: true }, // exitOnError true for top-level tasks
    )
  }

  async _addFileAndInstallPackages(
    task: ListrTaskWrapper<any, any>,
    /**
     * The parsed content of the RedwoodUI package.json
     */
    fileBeingAdded: string,
    filePath: string,
  ) {
    const dependencies: Record<string, string> =
      this.rwuiPackageJson.dependencies
    const devDependencies: Record<string, string> =
      this.rwuiPackageJson.devDependencies

    const packageImports = extractPackageImports(fileBeingAdded)

    const depsToInstall: string[] = []
    const devDepsToInstall: string[] = []

    packageImports.forEach((pkg) => {
      // Find the longest matching package name in dependencies or devDependencies
      let matchedPkg = ''
      for (const dep in dependencies) {
        if (pkg.startsWith(dep) && dep.length > matchedPkg.length) {
          matchedPkg = dep
        }
      }
      for (const devDep in devDependencies) {
        if (pkg.startsWith(devDep) && devDep.length > matchedPkg.length) {
          matchedPkg = devDep
        }
      }

      // TODO don't install if a newer version is in the project's web/package.json
      if (dependencies[matchedPkg]) {
        depsToInstall.push(`${matchedPkg}@${dependencies[matchedPkg]}`)
      } else if (devDependencies[matchedPkg]) {
        devDepsToInstall.push(`${matchedPkg}@${devDependencies[matchedPkg]}`)
      }
    })

    if (depsToInstall.length > 0 || devDepsToInstall.length > 0) {
      const hasExistingOutput = task.output !== undefined
      const outputMessage = `As part of adding the file ${filePath}, installing the following packages...\n`

      if (hasExistingOutput) {
        task.output += outputMessage
      } else {
        task.output = outputMessage
      }
    }

    // Install the dependencies
    if (depsToInstall.length > 0) {
      task.output += `As dependencies: ${depsToInstall.join(', ')}\n`
      await execa('yarn', ['workspace', 'web', 'add', ...depsToInstall])
    }

    // Install the devDependencies
    if (devDepsToInstall.length > 0) {
      task.output += `As devDependencies: ${devDepsToInstall.join(', ')}\n`
      await execa('yarn', [
        'workspace',
        'web',
        'add',
        '-D',
        ...devDepsToInstall,
      ])
    }

    // Write the file to the specified path
    fs.writeFileSync(filePath, fileBeingAdded)
  }

  /**
   * Installs a component from the RedwoodUI repo into the user's project.
   * Installs any required packages as well.
   *
   * TODO: Some components rely on other components. Check, and install as well.
   */
  async _installComponent(
    task: ListrTaskWrapper<any, any>,
    componentName: string,
    componentType: 'standard' | 'form' = 'standard',
  ) {
    const componentFilePath = `web/src/ui/${componentType === 'form' ? 'formFields/' : ''}${componentName}/${componentName}.tsx`
    const componentStoriesFilePath = `web/src/ui/${componentType === 'form' ? 'formFields/' : ''}${componentName}/${componentName}.stories.tsx`

    ensureDirectoryExistence(componentFilePath)

    const componentContent = await fetchFromRWUIRepo(componentFilePath)
    await this._addFileAndInstallPackages(
      task,
      componentContent as string,
      componentFilePath,
    )
    if (this.usingStorybook) {
      const componentStoriesContent = await fetchFromRWUIRepo(
        componentStoriesFilePath,
      )
      await this._addFileAndInstallPackages(
        task,
        componentStoriesContent as string,
        componentStoriesFilePath,
      )
    }
  }
}

/**
 * Fetches a file from the RedwoodUI repo.
 * Uses the GitHub REST API to fetch the file, rather than Octokit,
 * because Octokit both adds a bunch of overhead
 * and was causing ESM/CJS related build issues that I didn't want to deal with :)
 *
 * However, because this is not an authenticated request, it is rate-limited to 60 requests per hour: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-unauthenticated-users
 * - This is actually too low for installing all components and their stories.
 * - Two options:
 *   - Just authenticate with a PAT
 *   - Download the entire repo as a ZIP into a temp dir that will need to be cleaned up, and read from there
 *
 * @returns string, if path is to file, or array of {name: string, path: string} if path is to a directory
 */
const fetchFromRWUIRepo = async (
  path: string,
): Promise<string | { name: string; path: string }[]> => {
  const owner = 'arimendelow'
  const repo = 'RedwoodUI'
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const githubToken =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.REDWOOD_GITHUB_TOKEN

  // Perform the fetch request
  const res = await fetch(apiUrl, {
    // @ts-expect-error — it doesn't like the way we're conditionally adding the Authorization header
    headers: {
      Accept: 'application/vnd.github.v3+json',
      // https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2022-11-28#supported-api-versions
      'X-GitHub-Api-Version': '2022-11-28',
      // https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28#user-agent
      'User-Agent': 'RedwoodUI Setup',
      Authorization: githubToken ? `Bearer ${githubToken}` : undefined,
    },
  })

  if (!res.ok) {
    // If we've timed out, tell users to add a PAT and give them a link to instructions
    // Check x-ratelimit-remaining header
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining')
    if (rateLimitRemaining === '0') {
      throw new Error(
        "You've hit the rate limit for unauthenticated requests to the GitHub API. To continue, you'll need to wait, or you can authenticate with a Personal Access Token (PAT) with the `public_repo` property. Create a PAT and store it under the environment variable GH_TOKEN. You can find instructions on how to do that here: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic",
      )
    } else {
      throw new Error(`Error fetching file from repo: ${res.statusText}`)
    }
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

function ensureDirectoryExistence(filePath: string): boolean {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
  return true
}

/**
 * Extracts package names from all import statements in a given file content.
 * - Note that this does not currently handle "require" statements.
 * - It also will exclude local imports (currently, those starting with "./" or "src/").
 * - Also note that this will just return the full import name, ie if you import from "pacakge/subpackage", it will return "package/subpackage".
 */
function extractPackageImports(fileContent: string): string[] {
  // Regular expression to match import statements and capture the package name
  const importRegex = /import\s.*?from\s['"](.*?)['"]/g
  const packages = new Set<string>()
  let match

  // Iterate over all matches in the file content
  while ((match = importRegex.exec(fileContent)) !== null) {
    // Extract the package name
    const pkg = match[1]
    // Only add non-local imports
    if (!pkg.startsWith('./') && !pkg.startsWith('src/')) {
      packages.add(pkg)
    }
  }

  // Convert the set of packages to an array and return it
  return Array.from(packages)
}
