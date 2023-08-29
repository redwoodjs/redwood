import execa from 'execa'
import semver from 'semver'

import { getCompatibilityData } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'

const { Select } = require('enquirer')

// TODO: Yarn3 requirement? What do we do, just not run? I'm not sure about this one.
export async function handler({ npmPackage, force, options }) {
  // Extract package name and version which the user provided
  const isScoped = npmPackage.startsWith('@')
  const packageName =
    (isScoped ? '@' : '') + npmPackage.split('@')[isScoped ? 1 : 0]
  const packageVersion = npmPackage.split('@')[isScoped ? 2 : 1] ?? 'latest'

  if (force) {
    console.log(
      'No compatibility check will be performed because you used the --force flag.'
    )
    if (
      semver.parse(packageVersion) !== null &&
      semver.lt(packageVersion, '1.0.0')
    ) {
      console.log(
        'Be aware that this package is under version 1.0.0 and so should be considered experimental.'
      )
    }
    await runPackage(packageName, packageVersion, options)
    return
  }

  console.log('Checking compatibility...')
  const compatibilityData = await getCompatibilityData(
    packageName,
    packageVersion
  )

  if (compatibilityData == null) {
    throw new Error(`No compatible version of '${packageName}' was found.`)
  }

  const { preferred, latestCompatible } = compatibilityData

  const preferredVersionIsCompatible =
    preferred.version === latestCompatible.version

  if (preferredVersionIsCompatible) {
    await showExperimentalWarning(preferred.version)
    await runPackage(packageName, preferred.version, options)
    return
  }

  const preferredVersionText = `${preferred.version}${
    preferred.tag ? ` (${preferred.tag})` : ''
  }`
  const latestCompatibleVersionText = `${latestCompatible.version}${
    latestCompatible.tag ? ` (${latestCompatible.tag})` : ''
  }`
  console.log(
    `The version ${preferredVersionText} of '${packageName}' is not compatible with your RedwoodJS project version.\nThe latest version compatible with your project is ${latestCompatibleVersionText}.`
  )

  let versionToUse
  try {
    const prompt = new Select({
      name: 'versionDecision',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'useLatestCompatibleVersion',
          message: `Use the latest compatible version: ${latestCompatibleVersionText}`,
        },
        {
          name: 'usePreferredVersion',
          message: `Continue anyway with version: ${preferredVersionText}`,
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
    versionToUse =
      promptResult === 'useLatestCompatibleVersion'
        ? latestCompatible.version
        : preferred.version
  } catch (error) {
    // SIGINT seems to throw a "" error so we'll attempt to ignore that
    if (error) {
      throw error
    }
    // TODO: Confirm that this is the right exit code in this case?
    process.exit(1)
  }
  await showExperimentalWarning(versionToUse)
  await runPackage(packageName, versionToUse, options)
}

async function showExperimentalWarning(version) {
  if (
    version === undefined ||
    semver.parse(version) === null ||
    semver.gte(version, '1.0.0')
  ) {
    return
  }

  try {
    const prompt = new Select({
      name: 'continue',
      message:
        'This package is under version 1.0.0 and so should be considered experimental. Would you like to continue?',
      choices: [
        // TODO: Happy with this default ordering?
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
