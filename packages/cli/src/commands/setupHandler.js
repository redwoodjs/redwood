import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import semver from 'semver'

import { getPaths } from '@redwoodjs/project-config'

// TODO: Items to discuss:
//  - Do we bother with this finding the latest compatible version logic?
//     - Do we prompt the user to confirm that they want to use the latest compatible version?
//  - Is it okay to install the package in the root workspace?
//  - Is it okay to install the package without an alias?
//     - Installing under an alias might give us a bit of a buffer from whatever the user already
//       has installed
//  - Do we instead attempt to install the package in a temporary place rather than the project?
//  - Are we happy with some sort of API defined by the setup command arguments?
//     - Currently I just pass in the project's root directory - I thought that might be useful
//  - I didn't attempt to make any of the output pretty, I wanted to confirm the functionality first
//  - I don't fully understand all the implications of using peerDependencies
//     - They don't handle pre-releases - does that cause any issues for us?
//     - We don't care about "build metadata" do we? (e.g. 1.0.0+build.1) - I don't think we do
//  - Should this be a different command?
//     - Unless you hit a specific subcommand of setup then we'll attempt to run this command.
//       This is likely to be confusing for users when they make a typo and we start complaining
//       about packages not existing or being incompatible. There's a remote possibility that
//       this could lead to a user unintentionally installing a package that immediately starts
//       executing code.
//  - Have I not fully considered how this works with the various tags redwood uses?
//     - This isn't quite like the auth setup behaviour because we're not expecting these packages
//       to be at the same versions or tags as the framework - they are independent packages.
//  - This probably needs some unit tests to check this compatibility logic works as expected
//     - Shouldn't be too difficult but I'll test after we're happy with the direction of this
//  - Are we happy with importing and then calling a specific function rather than using a bin script?
//     - It felt like we might have some more flexibility this way
//     - Packages can always define a bin script that calls the function if they want to so they can be
//       used with npx or whatever

export async function handler({ npmpackage: npmPackage, force }) {
  // Get the current version of RedwoodJS
  const projectPackageJson = fs.readJSONSync(
    path.join(getPaths().base, 'package.json')
  )
  const redwoodVersion = projectPackageJson.devDependencies['@redwoodjs/core']

  // Extract package name and version
  const isScoped = npmPackage.startsWith('@')
  const packageName =
    (isScoped ? '@' : '') + npmPackage.split('@')[isScoped ? 1 : 0]
  const packageVersion = npmPackage.split('@')[isScoped ? 2 : 1]

  // Get the package information from NPM registry
  // Valid package names are URL safe so we can just slot it right in here
  const res = await fetch(`https://registry.npmjs.org/${packageName}`)
  const packument = await res.json()

  // Check if there was an error fetching the package's information
  if (packument.error) {
    console.error("There was an error fetching the package's information:")
    console.error(packument.error)
    return
  }

  // Check if the package has the requested version
  if (
    packageVersion !== undefined &&
    packument.versions[packageVersion] === undefined
  ) {
    console.error(
      `The package ${packageName} does not have the version ${packageVersion}`
    )
    return
  }

  // Determine the version to try to use, defaulting to the latest version of the published package
  const version = packageVersion || packument['dist-tags'].latest
  if (packageVersion === undefined) {
    console.log(
      `No version specified, attempting to use the latest version which is ${version}`
    )
  }

  // Does that version of the package support the current version of RedwoodJS?
  // We expect the package to have a peer dependency on @redwoodjs/core
  let preferredVersionIsCompatible = false
  const redwoodPeerDependency =
    packument.versions[version].peerDependencies?.['@redwoodjs/core']
  if (redwoodPeerDependency !== undefined) {
    preferredVersionIsCompatible = semver.satisfies(
      redwoodVersion,
      redwoodPeerDependency
    )
  }

  // For convenience, we'll try to find a compatible version of the package if the preferred version is not compatible
  let latestCompatibleVersion = undefined
  if (!preferredVersionIsCompatible && !force) {
    const versions = semver.sort(Object.keys(packument.versions))
    for (let i = versions.length - 1; i >= 0; i--) {
      const redwoodPeerDependency =
        packument.versions[versions[i]].peerDependencies?.['@redwoodjs/core']
      if (redwoodPeerDependency === undefined) {
        continue
      }
      if (semver.satisfies(redwoodVersion, redwoodPeerDependency)) {
        latestCompatibleVersion = versions[i]
        break
      }
    }
  }

  // Determine the version to install based on compatibility and user input
  let versionToInstall = undefined
  if (preferredVersionIsCompatible || force) {
    versionToInstall = version
  } else {
    if (packageVersion !== undefined) {
      console.log(
        `The version ${packageVersion} of ${packageName} is not compatible with RedwoodJS ${redwoodVersion}.`
      )
      return
    }

    if (latestCompatibleVersion === undefined) {
      console.error(`No compatible version of ${packageName} was found.`)
      return
    }

    console.log(
      `The version ${version} of ${packageName} is not compatible with RedwoodJS ${redwoodVersion}.`
    )
    console.log(`The latest compatible version is ${latestCompatibleVersion}.`)

    // TODO: Prompt the user to confirm that they want to use the latest compatible version
    //       For now, let's always use the latest compatible version
    if (Math.random() < 2.0) {
      versionToInstall = latestCompatibleVersion
    } else {
      return
    }
  }

  // Install the package
  console.log(`Installing ${packageName}@${versionToInstall}...`)
  await execa('yarn', ['add', '--dev', `${packageName}@${versionToInstall}`], {
    stdio: 'inherit',
  })

  // Load the package and run the setup function
  console.log(`Running setup for ${packageName}@${versionToInstall}...`)
  console.log('\n')
  const { setup: setupFunction } = await import(packageName)
  await setupFunction({
    projectDirectory: getPaths().base,
  })
  console.log('\n')

  // Remove the package
  console.log(`Removing ${packageName}...`)
  await execa('yarn', ['remove', `${packageName}`], {
    stdio: 'inherit',
  })
}
