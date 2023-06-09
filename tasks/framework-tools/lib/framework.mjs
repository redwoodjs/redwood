/* eslint-env node */

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
  'packages'
)

const IGNORE_PACKAGES = ['@redwoodjs/codemods', 'create-redwood-app']

/**
 * Returns a list of the `@redwoodjs` package.json files that are published to npm
 * and installed into a Redwood Project.
 *
 * The reason there's more logic here than seems necessary is because we have package.json files
 * like packages/web/toast/package.json that aren't real packages, but just entry points.
 *
 * @returns {string[]} A list of package.json file paths.
 */
export function getFrameworkPackageJsonPaths() {
  let output = execSync('yarn workspaces list --json', {
    encoding: 'utf-8',
  })

  const packageLocationsAndNames = output
    .trim()
    .split('\n')
    .map(JSON.parse)
    // Fliter out the root package.
    .filter(({ location }) => location !== '.')
    // Some packages we won't bother copying into Redwood projects.
    .filter(({ name }) => !IGNORE_PACKAGES.includes(name))

  const frameworkPackageJsonPaths = packageLocationsAndNames.map(
    ({ location }) => {
      return path.join(REDWOOD_FRAMEWORK_PATH, location, 'package.json')
    }
  )

  return frameworkPackageJsonPaths
}

/**
 * The dependencies used by `@redwoodjs` packages.
 *
 * @returns {{ [key: string]: string }?} A map of package names to versions.
 */
export function getFrameworkDependencies(
  packageJsonPaths = getFrameworkPackageJsonPaths()
) {
  const dependencies = {}

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = fs.readJSONSync(packageJsonPath)

    for (const [name, version] of Object.entries(
      packageJson?.dependencies ?? {}
    )) {
      // Skip `@redwoodjs` packages, since these are processed by the workspace.
      if (name.startsWith('@redwoodjs/')) {
        continue
      }

      dependencies[name] = version

      // Throw if there's duplicate dependencies that aren't same version.
      if (dependencies[name] && dependencies[name] !== version) {
        throw new Error(
          `${name} dependency version mismatched, please make sure the versions are the same`
        )
      }
    }
  }

  return dependencies
}

/**
 * The files included in `@redwoodjs` packages.
 * Note: The packages must be built.
 *
 * @returns {{ [key: string]: string[] }} A map of package names to files.
 */
export async function getFrameworkPackagesFiles(
  packageJsonPaths = getFrameworkPackageJsonPaths()
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
  packages = getFrameworkPackageJsonPaths()
) {
  let bins = {}

  for (const packageFile of packages) {
    let packageJson

    try {
      packageJson = JSON.parse(fs.readFileSync(packageFile))
    } catch (e) {
      throw new Error(packageFile + ' is not a valid package.json file.')
    }

    if (!packageJson.name) {
      continue
    }

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
 **/
export function resolvePackageJsonPath(filePath) {
  const [packageName] = path
    .relative(REDWOOD_PACKAGES_PATH, filePath)
    .split(path.sep)

  return path.join(REDWOOD_PACKAGES_PATH, packageName, 'package.json')
}

/**
 * @param {string} packageJsonPath
 * @returns {string} The package name if it has one
 */
export function getPackageJsonName(packageJsonPath) {
  return fs.readJSONSync(packageJsonPath).name
}
