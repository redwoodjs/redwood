/* eslint-env node */

import path from 'node:path'

import execa from 'execa'
import fs from 'fs-extra'
import ora from 'ora'
import { rimraf } from 'rimraf'
import terminalLink from 'terminal-link'

import {
  getFrameworkDependencies,
  getFrameworkPackageJsonPaths,
  getFrameworkPackagesFiles,
  getFrameworkPackagesBins,
  getPackageJsonName,
} from './framework.mjs'

/**
 * Sets binaries as executable and creates symlinks to `node_modules/.bin` if they do not exist.
 */
export function fixProjectBinaries(projectPath) {
  const bins = getFrameworkPackagesBins()

  for (let [binName, binPath] of Object.entries(bins)) {
    // if the binPath doesn't exist, create it.
    const binSymlink = path.join(projectPath, 'node_modules/.bin', binName)
    binPath = path.join(projectPath, 'node_modules', binPath)

    if (!fs.existsSync(binSymlink)) {
      fs.mkdirSync(path.dirname(binSymlink), {
        recursive: true,
      })
      fs.symlinkSync(binPath, binSymlink)
    }

    console.log('chmod +x', terminalLink(binName, binPath))
    fs.chmodSync(binSymlink, '755')
    fs.chmodSync(binPath, '755')
  }
}

/**
 * Add all the `@redwoodjs` packages' dependencies to the root `package.json` in a Redwood Project.
 *
 * @param {string} packageJsonPath - The path to the root `package.json` in a Redwood Project.
 * @param {{ [key: string]: string }?} dependencies - A map of package names to versions.
 *
 * @returns {void}
 */
export function addDependenciesToPackageJson(
  packageJsonPath,
  dependencies = getFrameworkDependencies()
) {
  const packageJsonLink = terminalLink(
    'package.json',
    'file://' + packageJsonPath
  )

  const numberOfDependencies = Object.keys(dependencies).length

  const spinner = ora(
    `Adding ${numberOfDependencies} framework dependencies to ${packageJsonLink}...`
  ).start()

  const packageJson = fs.readJSONSync(packageJsonPath)

  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependencies,
  }

  fs.writeJSONSync(packageJsonPath, packageJson, { spaces: 2 })

  spinner.succeed(
    `Added ${numberOfDependencies} framework dependencies to ${packageJsonLink}`
  )
}

export function installProjectPackages(projectPath) {
  const spinner = ora("Running 'yarn install'...")

  spinner.start()

  try {
    execa.commandSync('yarn install', {
      cwd: projectPath,
      shell: true,
    })
    spinner.succeed("Ran 'yarn install'")
  } catch (e) {
    spinner.warn(
      `Error running 'yarn install', check ${terminalLink(
        'yarn-error.log',
        'file://' + path.join(projectPath, 'yarn-error.log')
      )} for more information.`
    )

    console.log('-'.repeat(80))
  }
}

export async function copyFrameworkFilesToProject(
  projectPath,
  packageJsonPaths = getFrameworkPackageJsonPaths()
) {
  // Loop over every package, delete all existing files, copy over the new files,
  // and fix binaries.
  const packagesFiles = await getFrameworkPackagesFiles(packageJsonPaths)

  const packageNamesToPaths = packageJsonPaths.reduce(
    (packageNamesToPaths, packagePath) => {
      packageNamesToPaths[getPackageJsonName(packagePath)] =
        path.dirname(packagePath)
      return packageNamesToPaths
    },
    {}
  )

  for (const [packageName, files] of Object.entries(packagesFiles)) {
    const packageDstPath = path.join(projectPath, 'node_modules', packageName)
    console.log(
      terminalLink(packageName, 'file://' + packageDstPath),
      files.length,
      'files'
    )
    await rimraf(packageDstPath)

    for (const file of files) {
      const src = path.join(packageNamesToPaths[packageName], file)
      const dst = path.join(packageDstPath, file)
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(src, dst)
    }
  }

  console.log()
  fixProjectBinaries(projectPath)
}
