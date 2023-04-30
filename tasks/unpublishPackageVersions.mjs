/* eslint-env node */

// HOW TO UNPUBLISH
// npm only allows unpublishig if the following conditions are met:
// 1. no other packages in the npm Public Registry depend on
// 2. had less than 300 downloads over the last week
// 3. has a single owner/maintainer
//
// At this time, I cannot approval to unpublish any packages < 1.0.0
// The script is working fine
//

import { execSync } from 'child_process'
import { basename } from 'node:path'
import readline from 'readline'

async function main() {
  const [_nodeBinPath, scriptPath, ...argOptions] = process.argv

  if (process.argv.includes('help', '-h', '--help')) {
    console.log(
      [
        '',
        `yarn node tasks/${basename(
          scriptPath
        )} [packageName] [targetTag] [targetVersion] --iKnowWhatImDoing`,
        '',
        '     STATUS: Options only work if you pass ALL or NONE',
        '',
        '     This script uses "npm unpublish" and passes "--dry-run" by default because safety.',
        '     Read on if you want to run it for realz...',
        '',
        `packageName [string]`,
        'name of package to unpublish',
        '',
        `targetTag [string]`,
        'valid npm tag, e.g. "canary"',
        '',
        `targetVersion [string]`,
        'semver to target using "startsWith" to match; e.g. "0.1" or "2.1" or "0"',
        '',
        `--iKnowWhatImDoing`,
        'if you really want to unpublish, you MUST pass this arg',
        '',
        '',
      ].join('\n')
    )

    return
  }

  const prompt = (argument) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      rl.question(
        `Please enter the ${argument} of the package to unpublish: `,
        (answer) => {
          rl.close()
          resolve(answer)
        }
      )
    })
  }

  try {
    // ONLY works if you pass all or none
    const packageName =
      argOptions.length === 0
        ? await prompt('Name')
        : argOptions[0] !== '--iKnowWhatImDoing'
        ? argOptions[0]
        : await prompt('Name')
    const targetTag =
      argOptions.length === 0
        ? await prompt('NPM Tag')
        : argOptions[1] !== '--iKnowWhatImDoing'
        ? argOptions[1]
        : await prompt('NPM Tag')
    const targetVersion =
      argOptions.length === 0
        ? await prompt('Semver "startsWith" string')
        : argOptions[2] !== '--iKnowWhatImDoing'
        ? argOptions[2]
        : await prompt('Semver "startsWith" string')

    const stdout = execSync(`npm view ${packageName} --json`).toString()

    const packageData = JSON.parse(stdout)
    const canaryVersions =
      packageData.versions && packageData.versions.length > 0
        ? packageData.versions
            .filter((version) => version.includes(targetTag))
            .filter((version) => version.startsWith(targetVersion))
        : []

    if (canaryVersions.length === 0) {
      console.log(
        `No "${targetTag}" packages found starting with semver "${targetVersion}" for package '${packageName}'.`
      )
      return
    }

    console.log(
      `The following versions of package '${packageName}' will be unpublished:`
    )
    console.log(canaryVersions.join(`\n`))
    console.log(
      '',
      `Total number of packages that will be unpublished: ${canaryVersions.length}`,
      ''
    )

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('Do you want to proceed? Type YES to confirm: ', (answer) => {
      rl.close()

      if (answer !== 'YES') {
        console.log('EJECTED! (phewf)')
        return
      }

      const dryRunOption = process.argv.includes('--iKnowWhatImDoing')
        ? ''
        : '--dry-run'

      for (const version of canaryVersions) {
        console.log(`Unpublishing ${packageName}@${version}...`)
        try {
          execSync(
            `npm unpublish ${packageName}@${version} ${dryRunOption} --force`
          )
        } catch (error) {
          console.error(
            `Unpublish Error ${packageName}@${canaryVersions}:`,
            `${error}`
          )
        }
      }
    })
  } catch (error) {
    console.error(`Error: ${error}`)
  }
}

main()
