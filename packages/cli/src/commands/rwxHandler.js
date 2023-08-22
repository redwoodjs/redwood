import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import semver from 'semver'

import { getPaths } from '@redwoodjs/project-config'

const { Select } = require('enquirer')

export async function handler({ npmPackage, force, options }) {
  // Get the project's version of RedwoodJS
  const projectPackageJson = fs.readJSONSync(
    path.join(getPaths().base, 'package.json')
  )
  const projectRedwoodVersion =
    projectPackageJson.devDependencies['@redwoodjs/core']

  // Extract package name and version
  const isScoped = npmPackage.startsWith('@')
  const packageName =
    (isScoped ? '@' : '') + npmPackage.split('@')[isScoped ? 1 : 0]
  const packageVersion = npmPackage.split('@')[isScoped ? 2 : 1]

  const semverVersion = semver.parse(packageVersion)
  const isUsingTag = packageVersion !== undefined && semverVersion === null

  // Get the package information from NPM registry
  // Valid package names are URL safe so we can just slot it right in here
  let packument
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}`)
    packument = await res.json()
  } catch (error) {
    if (!force) {
      throw error
    }
  }

  // If the user used the --force flag and we couldn't fetch the package's information, we'll just run it anyway
  // without any additional checks
  if (packument === undefined && force) {
    console.error(
      'We could not perform compatibility checks but will proceed because you used the --force flag.'
    )
    await runPackage(packageName, packageVersion, options)
    return
  }

  // Check if there was an error fetching the package's information
  if (packument.error !== undefined) {
    if (packument.error === 'Not found') {
      throw new Error(`The package '${packageName}' does not exist`)
    }
    if (force) {
      console.error("There was an error fetching the package's information:")
      console.error(packument.error)
      console.error('We will proceed anyway because you used the --force flag.')
    } else {
      throw new Error(packument.error)
    }
  }

  // Check if the package has the requested version/tag
  if (packageVersion !== undefined) {
    if (isUsingTag) {
      if (packument['dist-tags'][packageVersion] === undefined) {
        throw new Error(
          `The package '${packageName}' does not have a tag ${packageVersion}`
        )
      }
    } else {
      if (packument.versions[packageVersion] === undefined) {
        throw new Error(
          `The package '${packageName}' does not have a version ${packageVersion}`
        )
      }
    }
  }

  // Determine the version to try to use, defaulting to the latest published version of the package
  const preferredVersion = isUsingTag
    ? packument['dist-tags'][packageVersion]
    : packageVersion ?? packument['dist-tags']?.latest
  let versionToUse = preferredVersion
  if (preferredVersion === undefined) {
    throw new Error(
      `No version was specified and no latest version was found for '${packageName}'`
    )
  }
  if (packageVersion === undefined) {
    console.log(
      `No version specified, defaulting to use the latest version which is ${preferredVersion}`
    )
  }

  // Does that version of the package support the current version of RedwoodJS?
  // We expect the package to have a peer dependency on @redwoodjs/core
  let preferredVersionIsCompatible = false
  const redwoodPeerDependency =
    packument.versions[preferredVersion].peerDependencies?.['@redwoodjs/core']
  if (redwoodPeerDependency === undefined) {
    if (!force) {
      throw new Error(
        `The package '${packageName}' does not have a peer dependency on '@redwoodjs/core'`
      )
    } else {
      console.error(
        `The package '${packageName}' does not have a peer dependency on '@redwoodjs/core'`
      )
      console.error('We will proceed anyway because you used the --force flag.')
    }
  } else {
    preferredVersionIsCompatible = semver.satisfies(
      projectRedwoodVersion,
      redwoodPeerDependency
    )
  }

  // For convenience, we'll try to find a compatible version of the package if the preferred version is not compatible
  let latestCompatibleVersion = undefined
  if (!preferredVersionIsCompatible) {
    const versions = semver.sort(Object.keys(packument.versions))
    for (let i = versions.length - 1; i >= 0; i--) {
      const redwoodPeerDependency =
        packument.versions[versions[i]].peerDependencies?.['@redwoodjs/core']
      if (redwoodPeerDependency === undefined) {
        continue
      }
      if (semver.satisfies(projectRedwoodVersion, redwoodPeerDependency)) {
        latestCompatibleVersion = versions[i]
        break
      }
    }
  }

  // Determine the version to install based on compatibility and user input
  if (preferredVersionIsCompatible || force) {
    versionToUse = preferredVersion
  } else {
    if (latestCompatibleVersion === undefined) {
      throw new Error(`No compatible version of '${packageName}' was found.`)
    }

    console.log(
      `The version ${preferredVersion} of '${packageName}' is not compatible with RedwoodJS ${projectRedwoodVersion}.`
    )
    console.log(`The latest compatible version is ${latestCompatibleVersion}.`)
    const prompt = new Select({
      name: 'versionDecision',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'useLatestCompatibleVersion',
          message: `Use the latest compatible version of ${latestCompatibleVersion}`,
        },
        {
          name: 'usePreferredVersion',
          message: `Continue anyway with version ${preferredVersion}`,
        },
        {
          name: 'exit',
          message: 'Exit',
        },
      ],
    })
    const promptResult = await prompt.run()
    if (promptResult === 'exit') {
      // TODO: Confirm that this is the right exit code in this case?
      process.exitCode = 1
      return
    }
    if (promptResult === 'useLatestCompatibleVersion') {
      versionToUse = latestCompatibleVersion
    }
  }

  // Run `yarn dlx` on the package and version
  await runPackage(packageName, versionToUse)
}

async function runPackage(packageName, version, options = []) {
  const versionString = version === undefined ? '' : `@${version}`
  console.log(`Running ${packageName}${versionString}...`)
  try {
    await execa('yarn', ['dlx', `${packageName}${versionString}`, ...options], {
      stdio: 'inherit',
      // TODO: Do we need to specify a specific cwd here, like the project root?
    })
  } catch (error) {
    process.exitCode = error.exitCode ?? 1
  }
}
