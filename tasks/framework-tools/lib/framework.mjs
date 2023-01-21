/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import Arborist from '@npmcli/arborist'
import c from 'ansi-colors'
import execa from 'execa'
import fg from 'fast-glob'
import packlist from 'npm-packlist'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const REDWOOD_PACKAGES_PATH = path.resolve(
  __dirname,
  '../../../packages'
)

/**
 * A list of the `@redwoodjs` package.json files that are published to npm
 * and installed into a Redwood Project.
 *
 * The reason there's more logic here than seems necessary is because we have package.json files
 * like packages/web/toast/package.json that aren't real packages, but just entry points.
 */
export function frameworkPkgJsonFiles() {
  let pkgJsonFiles = fg.sync('**/package.json', {
    cwd: REDWOOD_PACKAGES_PATH,
    ignore: [
      '**/node_modules/**',
      '**/create-redwood-app/**',
      '**/codemods/**',
    ],
    absolute: true,
  })

  for (const pkgJsonFile of pkgJsonFiles) {
    try {
      JSON.parse(fs.readFileSync(pkgJsonFile))
    } catch (e) {
      throw new Error(pkgJsonFile + ' is not a valid package.json file.')
    }
  }

  pkgJsonFiles = pkgJsonFiles.filter((pkgJsonFile) => {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile))
    return !!pkgJson.name
  })

  return pkgJsonFiles
}

/**
 * The dependencies used by `@redwoodjs` packages.
 */
export function frameworkDependencies(packages = frameworkPkgJsonFiles()) {
  const dependencies = {}

  for (const packageJsonPath of packages) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

    for (const [name, version] of Object.entries(
      packageJson?.dependencies ?? {}
    )) {
      // Skip `@redwoodjs/*` packages, since these are processed
      // by the workspace.
      if (!name.startsWith('@redwoodjs/')) {
        dependencies[name] = version

        // Warn if the packages are duplicated and are not the same version.
        if (dependencies[name] && dependencies[name] !== version) {
          console.warn(
            c.yellow('Warning:'),
            name,
            'dependency version mismatched, please make sure the versions are the same!'
          )
        }
      }
    }
  }
  return sortObjectKeys(dependencies)
}

/**
 * The files included in `@redwoodjs` packages.
 * Note: The packages must be built.
 */
export async function frameworkPackagesFiles(
  packages = frameworkPkgJsonFiles()
) {
  const fileList = {}
  for (const packageFile of packages) {
    const packageJson = JSON.parse(fs.readFileSync(packageFile))

    const arborist = new Arborist({ path: path.dirname(packageFile) })
    const tree = await arborist.loadActual()
    fileList[packageJson.name] = await packlist(tree)
  }
  return fileList
}

/**
 * Returns execute files for `@redwoodjs` packages.
 **/
export function frameworkPackagesBins(packages = frameworkPkgJsonFiles()) {
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
  // Do we want the package name?
  const packageName = filePath
    .replace(REDWOOD_PACKAGES_PATH, '')
    .split(path.sep)[1]
  return path.join(REDWOOD_PACKAGES_PATH, packageName, 'package.json')
}

export function packageJsonName(packageJsonPath) {
  return JSON.parse(fs.readFileSync(packageJsonPath), 'utf-8').name
}

/**
 * Clean Redwood packages.
 */
export function cleanPackages(packages = frameworkPkgJsonFiles()) {
  const packageNames = packages.map(packageJsonName)

  execa.sync(
    'yarn lerna run build:clean',
    ['--parallel', `--scope={${packageNames.join(',') + ','}}`],
    {
      shell: true,
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../../../'),
    }
  )
}

/**
 * Build Redwood packages.
 */
export function buildPackages(packages = frameworkPkgJsonFiles()) {
  const packageNames = packages.map(packageJsonName)
  execa.sync(
    'yarn lerna run build',
    ['--parallel', `--scope={${packageNames.join(',') + ','}}`],
    {
      shell: true,
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../../../'),
    }
  )
}

function sortObjectKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}
