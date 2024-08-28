/* eslint-env node */
// @ts-check

import { execSync } from 'node:child_process'
import path from 'node:path'
import url from 'node:url'

import Arborist from '@npmcli/arborist'
import fs from 'fs-extra'
import packlist from 'npm-packlist'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const REDWOOD_FRAMEWORK_PATH = path.resolve(__dirname, '../../../')

export const REDWOOD_PACKAGES_PATH = path.join(
  REDWOOD_FRAMEWORK_PATH,
  'packages',
)

const IGNORE_PACKAGES = ['@redwoodjs/codemods', 'create-redwood-app']

/**
 * Get the names, locations, and absolute package.json file paths of all the packages we publish to NPM.
 *
 * @returns {{ location: string, name: string, packageJsonPath: string }[]}
 */
function getFrameworkPackagesData() {
  const output = execSync('yarn workspaces list --json', {
    encoding: 'utf-8',
  })

  const frameworkPackagesData = output
    .trim()
    .split('\n')
    .map(JSON.parse)
    // Fliter out the root package.
    .filter(({ location }) => location !== '.')
    // Some packages we won't bother copying into Redwood projects.
    .filter(({ name }) => !IGNORE_PACKAGES.includes(name))

  for (const frameworkPackage of frameworkPackagesData) {
    frameworkPackage.packageJsonPath = path.join(
      REDWOOD_FRAMEWORK_PATH,
      frameworkPackage.location,
      'package.json',
    )
  }

  return frameworkPackagesData
}

/**
 * @returns {string[]} A list of absolute package.json file paths.
 */
export function getFrameworkPackageJsonPaths() {
  return getFrameworkPackagesData().map(
    ({ packageJsonPath }) => packageJsonPath,
  )
}

/**
 * The dependencies used by `@redwoodjs` packages.
 *
 * @returns {{ [key: string]: string }?} A map of package names to versions.
 */
export function getFrameworkDependencies(
  packageJsonPaths = getFrameworkPackageJsonPaths(),
) {
  const dependencies = {}

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = fs.readJSONSync(packageJsonPath)

    for (const [name, version] of Object.entries(
      packageJson?.dependencies ?? {},
    )) {
      // Skip `@redwoodjs` packages, since these are processed by the workspace.
      if (name.startsWith('@redwoodjs/')) {
        continue
      }

      // Skip storybook packages because they're installed manually by the user.
      if (name.startsWith('storybook-framework-redwoodjs-vite')) {
        continue
      }

      dependencies[name] = version

      // Throw if there's duplicate dependencies that aren't same version.
      if (dependencies[name] && dependencies[name] !== version) {
        throw new Error(
          `${name} dependency version mismatched, please make sure the versions are the same`,
        )
      }
    }
  }

  return dependencies
}

/**
 * The files included in all the `@redwoodjs` packages.
 * The packages must be built for this to work.
 *
 * @returns {Promise<{ [key: string]: string[] }>} A map of package names to files.
 */
export async function getFrameworkPackagesFiles(
  packageJsonPaths = getFrameworkPackageJsonPaths(),
) {
  const frameworkPackageFiles = {}

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = fs.readJSONSync(packageJsonPath)
    const arborist = new Arborist({ path: path.dirname(packageJsonPath) })
    const tree = await arborist.loadActual()
    frameworkPackageFiles[packageJson.name] = await packlist(tree)
  }

  return frameworkPackageFiles
}

/**
 * Returns execute files for `@redwoodjs` packages.
 **/
export function getFrameworkPackagesBins(
  packageJsonPaths = getFrameworkPackageJsonPaths(),
) {
  let bins = {}

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = fs.readJSONSync(packageJsonPath)

    if (!packageJson.bin) {
      continue
    }

    // @TODO @MARK this interferes with having a single bin file
    // yarn will automatically switch from using an a Map to a string Array
    for (const [binName, binPath] of Object.entries(packageJson.bin)) {
      bins[binName] = path.join(packageJson.name, binPath)
    }
  }

  return bins
}

/**
 * Determine base package directory for any filename in it's path.
 *
 * @param {string} filePath
 * @returns {string} The package.json path
 **/
export function resolvePackageJsonPathFromFilePath(filePath) {
  const packageJsonPath = findUp('package.json', path.dirname(filePath))

  const frameworkPackageJsonPaths = getFrameworkPackageJsonPaths()

  if (frameworkPackageJsonPaths.includes(packageJsonPath)) {
    return packageJsonPath
  }

  // There's some directories that have their own package.json, but aren't published to npm,
  // like @redwoodjs/web/apollo. We want the path to @redwoodjs/web's package.json, not @redwoodjs/web/apollo's.
  return findUp('package.json', path.resolve(filePath, '../../'))
}

/**
 * @param {string} packageJsonPath
 * @returns {string} The package name if it has one
 */
export function getPackageName(packageJsonPath) {
  return fs.readJSONSync(packageJsonPath).name
}

/**
 * Find a file by walking up parent directories. Taken from @redwoodjs/project-config.
 *
 * @param {string} file The file to find.
 * @param {string} startingDirectory The directory to start searching from.
 * @returns {string | null} The path to the file, or null if it can't be found.
 */
export function findUp(file, startingDirectory = process.cwd()) {
  const possibleFilepath = path.join(startingDirectory, file)

  if (fs.existsSync(possibleFilepath)) {
    return possibleFilepath
  }

  const parentDirectory = path.dirname(startingDirectory)

  // If we've reached the root directory, there's no file to be found.
  if (parentDirectory === startingDirectory) {
    return null
  }

  return findUp(file, parentDirectory)
}
