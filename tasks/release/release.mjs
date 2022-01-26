#!/usr/bin/env node
/* eslint-env node, es6*/
import prompts from 'prompts'
import { $ } from 'zx'

import updateNextReleasePRsMilestone from './updateNextReleasePRsMilestone.mjs'

const { semver } = await exitOnCancelPrompts({
  type: 'select',
  name: 'semver',
  message: 'which semver are you releasing?',
  choices: ['major', 'minor', 'patch'],
  initial: 2,
})

// Get the most-recent tag and get the next version from it.
// `git describe --abbrev=0` should output something like like `v0.42.1`.
const PO = await $`git describe --abbrev=0`
const previousVersion = PO.stdout.trim()
let nextVersion = getNextVersion(semver, previousVersion)

// Confirm that we got the next version right; give the user a chance to correct it if we didn't.
nextVersion = confirmNextVersion(nextVersion)

const shouldUpdateNextReleasePRsMilestone = await confirm(
  `Update next-release PRs milestone to ${nextVersion}?`
)

if (shouldUpdateNextReleasePRsMilestone) {
  try {
    await updateNextReleasePRsMilestone(nextVersion)
  } catch (e) {
    console.log(`Couldn't update next-release PRs milestone to ${nextVersion}`)
    console.log(e)
  }
}

switch (semver) {
  case 'major':
    {
      const confirmed = await confirm(
        "You're about to release a major version. Are you sure?"
      )
      if (confirmed) {
        console.log('Wait till after v1!')
        // await releaseMajor(nextVersion)
      }
    }
    break
  case 'minor':
    await releaseMinor(nextVersion)
    break
  case 'patch':
    await releasePatch(nextVersion)
    break
}

console.log(`Released ${nextVersion}`)

// Helpers

/**
 * Take the output from `git describe --abbrev=0` (which is something like `'v0.42.1'`),
 * and return an array of numbers ([0, 42, 1]).
 *
 * @param {string} version the version string (obtain by running `git describe --abbrev=0`)
 * @returns [string, string, string]
 */
function parseGitTag(version) {
  if (version.startsWith('v')) {
    version = version.substring(1)
  }

  return version.split('.').map(Number)
}

/**
 * Bump the version according to the semver we're releasing.
 *
 * @typedef {'major' | 'minor' | 'patch'} Semver
 * @param {Semver} semver
 * @param {string} previousVersion
 */
function getNextVersion(semver, previousVersion) {
  switch (semver) {
    case 'major': {
      const [major] = parseGitTag(previousVersion)
      return `v${[major + 1, 0, 0].join('.')}`
    }
    case 'minor': {
      const [major, minor] = parseGitTag(previousVersion)
      return `v${[major, minor + 1, 0].join('.')}`
    }
    case 'patch': {
      const [major, minor, patch] = parseGitTag(previousVersion)
      return `v${[major, minor, patch + 1].join('.')}`
    }
  }
}

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
function exitOnCancelPrompts(promptsObject, promptsOptions) {
  return prompts(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

/**
 * Wrapper around confirm type `prompts`.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
async function confirm(message) {
  const answer = await exitOnCancelPrompts({
    type: 'confirm',
    name: 'confirm',
    message,
  })

  return answer.confirm
}

/**
 * @param {string} nextVersion
 */
async function confirmNextVersion(nextVersion) {
  const nextVersionConfirmed = await confirm(
    `the next release is ${nextVersion}`
  )

  if (nextVersionConfirmed) {
    return nextVersion
  }

  const answer = await exitOnCancelPrompts({
    type: 'text',
    name: 'nextVersion',
    message: 'enter the next version',
  })

  return answer.nextVersion
}

/**
 * Right now releasing a major is the same as releasing a minor.
 *
 * @param {string} nextVersion
 */
// function releaseMajor(nextVersion) {
//   return releaseMajorOrMinor('major', nextVersion)
// }

/**
 * @param {string} nextVersion
 */
function releaseMinor(nextVersion) {
  return releaseMajorOrMinor('minor', nextVersion)
}

/**
 * Does all the work of releasing a major or minor.
 *
 * - starting from main, checkout a release branch
 * - prepare the repo for release
 * - update the versions and build
 * - commit and tag
 * - push and publish
 * - genreate release notes
 *
 * @param {Semver} semver
 * @param {string} nextVersion
 */
async function releaseMajorOrMinor(semver, nextVersion) {
  const PO = await $`git branch --show-current`
  const branch = PO.stdout.trim()
  if (branch !== 'main') {
    await $`git checkout main`
  }

  await $`git checkout -b release/${semver}/${nextVersion}`

  await $`git clean -fxd`
  await $`yarn install`

  await $`./tasks/update-package-versions ${nextVersion}`

  await $`yarn build`

  await $`git commit -am ${nextVersion}`
  await $`git tag -am ${nextVersion} ${nextVersion}`

  // await $`git push && git push --tags`
  // await $`yarn lerna publish from-package`

  await $`yarn release-notes ${nextVersion}`
}

/**
 * This is incomplete.
 *
 * @param {string} nextVersion
 */
async function releasePatch(nextVersion) {
  await $`git checkout tags/${previousVersion} -b release/patch/${nextVersion}`

  await $`git push origin release/patch/${nextVersion}`
  await `open https://github.com/redwoodjs/redwood/compare/${previousVersion}..release/patch/${nextVersion}`

  /**
   * - cherry pick
   * - handle conflicts
   * - push
   * - diff
   * - publish rc
   */

  await $`git clean -fxd`
  await $`yarn install`

  await $`./tasks/update-package-versions ${nextVersion}`

  await $`yarn build`
  await $`git commit -am "${nextVersion}"`
  await $`git tag -am ${nextVersion} "${nextVersion}"`

  /**
   * - checkout main
   * - merge commit
   * - delete release branch
   */
}
