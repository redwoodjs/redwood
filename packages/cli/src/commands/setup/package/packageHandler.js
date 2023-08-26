import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import semver from 'semver'

import { getPaths } from '@redwoodjs/project-config'

const { Select } = require('enquirer')

// TODO: Yarn3 requirement? What do we do, just not run? I'm not sure about this one.
export async function handler({ npmPackage, force, options }) {
  console.log('Checking compatibility...')

  // Get the project's version of RedwoodJS from the root package.json's
  // @redwoodjs/core dev dependency
  const projectPackageJson = fs.readJSONSync(
    path.join(getPaths().base, 'package.json')
  )
  const projectRedwoodVersion =
    projectPackageJson.devDependencies['@redwoodjs/core']

  // Extract package name and version which the user provided
  const isScoped = npmPackage.startsWith('@')
  const packageName =
    (isScoped ? '@' : '') + npmPackage.split('@')[isScoped ? 1 : 0]
  const packageVersion = npmPackage.split('@')[isScoped ? 2 : 1]

  const semverVersion = semver.parse(packageVersion)
  const isUsingTag = packageVersion !== undefined && semverVersion === null

  // Get the package information from NPM registry
  let packument
  try {
    // Valid package names are URL safe so we can just slot it right in here
    const res = await fetch(`https://registry.npmjs.org/${packageName}`)
    packument = await res.json()
  } catch (error) {
    if (!force) {
      throw error
    }
  }

  if (packument === undefined && force) {
    console.error(
      'We could not perform compatibility checks but will proceed because you used the --force flag.'
    )
    await showExperimentalWarning(packageVersion, force)
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
      `No version specified, defaulting to use the latest published version which is ${preferredVersion}`
    )
  }

  // Does that version of the package support the current version of RedwoodJS?
  // We expect the package to have redwoodjs specified in its engines field
  let preferredVersionIsCompatible = false
  const packageRedwoodEngine =
    packument.versions[preferredVersion].engines?.redwoodjs
  if (packageRedwoodEngine === undefined) {
    if (!force) {
      throw new Error(
        `The package '${packageName}' does not specify a RedwoodJS compatibility version/range`
      )
    } else {
      console.error(
        `The package '${packageName}' does not specify a RedwoodJS compatibility version/range`
      )
    }
  } else {
    try {
      preferredVersionIsCompatible = semver.satisfies(
        projectRedwoodVersion,
        packageRedwoodEngine
      )
    } catch (error) {
      if (!force) {
        throw new Error(
          `The package '${packageName}' has an invalid RedwoodJS compatibility version/range`
        )
      } else {
        console.error(
          `The package '${packageName}' has an invalid RedwoodJS compatibility version/range`
        )
      }
    }
  }

  // For convenience, we'll try to find a compatible version of the package if the preferred version is not compatible
  let latestCompatibleVersion = undefined
  if (!preferredVersionIsCompatible) {
    const versions = semver.sort(Object.keys(packument.versions))
    for (let i = versions.length - 1; i >= 0; i--) {
      const redwoodEngineSpecified =
        packument.versions[versions[i]].engines?.redwoodjs
      if (redwoodEngineSpecified === undefined) {
        continue
      }
      if (semver.satisfies(projectRedwoodVersion, redwoodEngineSpecified)) {
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
      `The version ${preferredVersion} of '${packageName}' is not compatible with your RedwoodJS project at version ${projectRedwoodVersion}.`
    )
    console.log(
      `The latest version compatible with your project is ${latestCompatibleVersion}.`
    )

    try {
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
            name: 'cancel',
            message: 'Cancel',
          },
        ],
      })
      const promptResult = await prompt.run()
      if (promptResult === 'cancel') {
        // TODO: Confirm that this is the right exit code in this case?
        process.exitCode = 1
        return
      }
      if (promptResult === 'useLatestCompatibleVersion') {
        versionToUse = latestCompatibleVersion
      } else {
        versionToUse = preferredVersion
      }
    } catch (error) {
      // SIGINT seems to throw a "" error so we'll attempt to ignore that
      if (error) {
        throw error
      }
      // TODO: Confirm that this is the right exit code in this case?
      process.exit(1)
    }
  }

  await showExperimentalWarning(versionToUse, force)
  await runPackage(packageName, versionToUse, options)
}

async function showExperimentalWarning(version, force) {
  if (version === undefined) {
    return
  }

  if (semver.parse(version) === null || semver.gte(version, '1.0.0')) {
    return
  }

  if (force) {
    console.log(
      'Beware that this package is under version 1.0.0 and so should be considered experimental.'
    )
    return
  }

  try {
    const prompt = new Select({
      name: 'continue',
      message:
        'This package is under version 1.0.0 and so should be considered experimental. Continue anyway?',
      choices: [
        {
          name: 'no',
          message: 'No',
        },
        {
          name: 'yes',
          message: 'Yes',
        },
      ],
    })
    const promptResult = await prompt.run()
    if (promptResult === 'no') {
      process.exit()
    }
  } catch (error) {
    // SIGINT seems to throw a "" error so we'll attempt to ignore that
    if (error) {
      throw error
    }
    // TODO: Confirm that this is the right exit code in this case?
    process.exit(1)
  }
}

async function runPackage(packageName, version, options = []) {
  const versionString = version === undefined ? '' : `@${version}`
  console.log(`Running ${packageName}${versionString}...`)
  try {
    await execa('yarn', ['dlx', `${packageName}${versionString}`, ...options], {
      stdio: 'inherit',
      cwd: getPaths().base,
    })
  } catch (error) {
    process.exitCode = error.exitCode ?? 1
  }
}
