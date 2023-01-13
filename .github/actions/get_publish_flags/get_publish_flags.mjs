import * as core from '@actions/core'
import { $ } from 'zx'

let args = []

const TAG = process.env.GITHUB_REF_NAME === 'next' ? 'next' : 'canary'

console.log({
  GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
  TAG
})

if (TAG === 'canary') {
  args.push('premajor')

  // Returns a string like v3.8.0
  /**
   * @type {`v${number}.${number}.${number}`}
   */
  const latestRelease = (
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`
  ).stdout.trim()

  console.log('Latest release:', latestRelease)

  // Get the major version from a string like v3.8.0
  const currentMajor = +latestRelease.match(/^v(?<currentMajor>\d)\./).groups.currentMajor
  const nextMajor = `${currentMajor + 1}.0.0`

  console.log('Current major:', nextMajor)
  console.log('Next major:', nextMajor)

  // Get the latest RC from NPM
  /**
   * @type {{ name: string, version: `${number}.${number}.${number}` }}
   */
  const { version: latestRC } = JSON.parse(await $`yarn npm info @redwoodjs/core@rc --fields version --json`)

  console.log('latest RC:', latestRC)

  if (latestRC.startsWith(nextMajor)) {
    console.log('The latest rc is the same as the canary; adding an extra minor to the canary')

    args.push('--rw-custom-bump')
  }
}

args = [
  ...args,
  '--include-merged-tags',
  '--canary',
  `--preid ${TAG}`,
  `--dist-tag ${TAG}`,
  '--force-publish',
  '--loglevel verbose',
  '--no-git-reset',
  '--yes',
]

console.log({ args })

core.setOutput('flags', `${args.join(' ')}`)
