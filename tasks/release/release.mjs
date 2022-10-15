/* eslint-env node, es2021 */

/**
 * Use this script to release a version of RedwoodJS:
 *
 * ```
 * yarn release
 * ```
 *
 * @remarks
 *
 * You'll need...
 *
 * 1. a GitHub token in your environment (GITHUB_TOKEN)
 * 2. to be logged into NPM
 * 3. the appropriate permissions on your NPM account (contact @thedavidprice)
 *
 * @todo
 *
 * - consider writing an e2e test using verdaccio
 */

import c from 'ansi-colors'
import boxen from 'boxen'
import notifier from 'node-notifier'
/**
 * See {@link https://github.com/google/zx}
 */
import { $, cd } from 'zx'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import octokit from './octokit.mjs'
import {
  exitOnCancelPrompts,
  confirm,
  confirmRuns,
  ask,
  check,
  fix,
  ok,
} from './prompts.mjs'
import updatePRsMilestone, { closeMilestone } from './updatePRsMilestone.mjs'

let milestone

export default async function release() {
  /**
   * Make sure that we're on main.
   */
  const gitBranchPO = await $`git branch --show-current`

  if (gitBranchPO.stdout.trim() !== 'main') {
    console.log(fix`Start from main`)
    process.exitCode = 1
    return
  }

  console.log(ok`On main`)

  /**
   * - ask for the desired semver
   * - get the current and next versions
   * - do a few basic validations so that we can fail early
   */
  const { semver } = await exitOnCancelPrompts({
    type: 'select',
    name: 'semver',
    message: ask`Which semver are you releasing?`,
    choices: [{ value: 'major' }, { value: 'minor' }, { value: 'patch' }],
    initial: 2,
  })

  /**
   * Get the most-recent tag and get the next version from it.
   * `git describe --abbrev=0` should output something like like `v0.42.1`.
   */
  const gitDescribePO = await $`git describe --abbrev=0`
  const currentVersion = gitDescribePO.stdout.trim()

  let nextVersion

  /**
   * Bump the version according to the semver we're releasing.
   */
  switch (semver) {
    case 'major': {
      const [major] = parseGitTag(currentVersion)
      nextVersion = `v${[major + 1, 0, 0].join('.')}`
      break
    }
    case 'minor': {
      const [major, minor] = parseGitTag(currentVersion)
      nextVersion = `v${[major, minor + 1, 0].join('.')}`
      break
    }
    case 'patch': {
      const [major, minor, patch] = parseGitTag(currentVersion)
      nextVersion = `v${[major, minor, patch + 1].join('.')}`
      break
    }
  }

  /**
   * Confirm that we got the next version right.
   * Give the user a chance to correct it if we didn't.
   */
  const nextVersionConfirmed = await confirm(
    check`The next release is ${nextVersion}`
  )

  if (!nextVersionConfirmed) {
    const answer = await exitOnCancelPrompts({
      type: 'text',
      name: 'nextVersion',
      message: ask`Enter the next version`,
      validate: (value) =>
        value.startsWith('v')
          ? true
          : `The next version has to start with a "v"`,
    })

    nextVersion = answer.nextVersion
  }

  /**
   * Check that the git tag doesn't already exist.
   */
  const gitTagPO = await $`git tag -l ${nextVersion}`

  if (gitTagPO.stdout.trim()) {
    console.log(
      c.bold(
        fix`Git tag ${nextVersion} already exists locally. You must resolve this before proceeding`
      )
    )

    process.exitCode = 1
    return
  }

  /**
   * Check that there's no merged PRs without a milestone.
   *
   * @remarks
   *
   * If we're not releasing a patch,
   * check that there's no merged PRs with "next-release-patch".
   */
  const {
    search: { nodes: pullRequests },
  } = await octokit.graphql(MERGED_PRS_NO_MILESTONE)

  if (pullRequests.length) {
    console.log(
      c.bold(
        fix`There shouldn't be any merged PRs without a milestone. You have to resolve this before proceeding`
      )
    )
    await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+no%3Amilestone`

    process.exitCode = 1
    return
  }

  console.log(c.bold(ok`No merged PRs without a milestone`))

  /**
   * If we're releasing a patch, we're done.
   * But if we're not, check that there's no PRs with the "next-release-patch" milestone.
   */
  if (semver === 'patch') {
    await confirm(
      check`Did you update the milestone of the merged PRs you plan to include in the patch to "next-release-patch"?`,
      { exitIfNo: true }
    )
  } else {
    const {
      search: { nodes: nextReleasePatchPullRequests },
    } = await octokit.graphql(MERGED_PRS_NEXT_RELEASE_PATCH_MILESTONE)

    if (!nextReleasePatchPullRequests.length) {
      console.log(
        c.bold(ok`No merged PRs with the ${'next-release-patch'} milestone`)
      )
    } else {
      console.log(
        c.bold(
          fix`If you're not releasing a patch, there shouldn't be any merged PRs with the "next-release-patch" milestone. You have to resolve this before proceeding`
        )
      )
      await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+milestone%3Anext-release-patch+`

      process.exitCode = 1
      return
    }
  }

  const fromTitle = 'next-release' + (semver === 'patch' ? '-patch' : '')

  milestone = await confirmRuns(
    ask`Ok to update ${fromTitle} PRs' milestone to ${nextVersion}?`,
    () => updatePRsMilestone(fromTitle, nextVersion)
  )

  /**
   * Do the release.
   */
  switch (semver) {
    case 'major':
      await releaseMajor(nextVersion)
      break
    case 'minor':
      await releaseMinor(nextVersion)
      break
    case 'patch':
      await releasePatch(currentVersion, nextVersion)
      break
  }
}

/**
 * Take the output from `git describe --abbrev=0` (which is something like `'v0.42.1'`),
 * and return an array of numbers ([0, 42, 1]).
 *
 * @param {string} version
 * @returns [string, string, string]
 */
function parseGitTag(version) {
  if (version.startsWith('v')) {
    version = version.substring(1)
  }

  return version.split('.').map(Number)
}

export const MERGED_PRS_NO_MILESTONE = `
  {
    search(query: "repo:redwoodjs/redwood is:pr is:merged no:milestone", first: 5, type: ISSUE) {
      nodes {
        ... on PullRequest {
          id
        }
      }
    }
  }
`

export const MERGED_PRS_NEXT_RELEASE_PATCH_MILESTONE = `
  {
    search(query: "repo:redwoodjs/redwood is:pr is:merged milestone:next-release-patch", first: 5, type: ISSUE) {
      nodes {
        ... on PullRequest {
          id
        }
      }
    }
  }
`

const releaseMajor = (nextVersion) => releaseMajorOrMinor('major', nextVersion)
const releaseMinor = (nextVersion) => releaseMajorOrMinor('minor', nextVersion)
/**
 * Right now releasing a major is the same as releasing a minor.
 *
 * @param {Semver} semver
 * @param {string} nextVersion
 */
async function releaseMajorOrMinor(semver, nextVersion) {
  const releaseBranch = ['release', semver, nextVersion].join('/')
  const releaseBranchExists = await branchExists(releaseBranch)

  if (releaseBranchExists) {
    await checkoutExisting(releaseBranch)
  } else {
    await confirmRuns(
      ask`Ok to checkout new branch ${releaseBranch}?`,
      () => $`git checkout -b ${releaseBranch}`,
      { exitIfNo: true }
    )
  }

  await confirm(
    ask`Ok to continue to publish, or do you want to stop here so that you can push this branch to GitHub to create an RC?`,
    { exitIfNo: true, exitCode: 0 }
  )

  await cleanInstallUpdate(nextVersion)
  notifier.notify('done')
  await confirmPackageVersions()
  await commitTagQA(nextVersion)
  notifier.notify('done')

  const releaseBranchExistsOnOrigin = await branchExistsOnOrigin(releaseBranch)

  await confirmRuns(
    ask`Everything passed local QA. Ok to push this branch and tag to GitHub and publish to NPM?`,
    [
      releaseBranchExistsOnOrigin
        ? () => $`git push`
        : () => $`git push -u origin ${releaseBranch}`,
      () => $`git push --tags`,
      () => $`yarn lerna publish from-package`,
      () => console.log(rocketBoxen(`Released ${c.green(nextVersion)}`)),
    ],
    { exitIfNo: true }
  )

  await cleanUpTasks(semver, nextVersion)
}

/**
 * @param {string} nextVersion
 */
async function releasePatch(currentVersion, nextVersion) {
  const releaseBranch = ['release', 'patch', nextVersion].join('/')
  const releaseBranchExists = await branchExists(releaseBranch)

  if (releaseBranchExists) {
    await checkoutExisting(releaseBranch)
  } else {
    await confirmRuns(
      ask`Ok to checkout new branch ${releaseBranch} from ${currentVersion} tag?`,
      /**
       * See https://git-scm.com/book/en/v2/Git-Basics-Tagging
       * Scroll down to "Checking out Tags".
       */
      () => $`git checkout -b ${releaseBranch} ${currentVersion}`,
      { exitIfNo: true }
    )
  }

  const releaseBranchExistsOnOrigin = await branchExistsOnOrigin(releaseBranch)

  const compareURL = 'https://github.com/redwoodjs/redwood/compare'

  if (!releaseBranchExistsOnOrigin) {
    await confirmRuns(
      ask`Ok to push new branch ${releaseBranch} to GitHub and open diff?`,
      [
        () => $`git push -u origin ${releaseBranch}`,
        () => $`open ${compareURL}/${currentVersion}...${releaseBranch}`,
      ],
      { exitIfNo: true }
    )

    await confirm('Diff look ok?', { exitIfNo: true })

    console.log(
      [
        '',
        `  👇 ${c.bgYellow(c.black(' HEADS UP '))}`,
        '  Remember to cherry pick PRs _in the same order as they were merged_',
        "  And after you're done, run... ",
        '    1. yarn (to update the lock file), and',
        '    2. yarn check',
        '',
      ].join('\n')
    )

    await confirm(ask`Done cherry picking?}`, { exitIfNo: true })

    await confirmRuns(
      ask`Ok to push new branch ${releaseBranch} to GitHub and open diff?`,
      [
        () => $`git push`,
        () => $`open ${compareURL}/${currentVersion}...${releaseBranch}`,
      ],
      { exitIfNo: true }
    )
    await confirm('Diff look ok?', { exitIfNo: true })
  }

  await cleanInstallUpdate(nextVersion)
  notifier.notify('done')
  await confirmPackageVersions()
  await commitTagQA(nextVersion)
  notifier.notify('done')

  await confirmRuns(
    ask`Everything passed local QA. Ok to push your branch and tag to GitHub and publish to NPM?`,
    [
      () => $`git push`,
      () => $`git push --tags`,
      () => $`yarn lerna publish from-package`,
      () => console.log(rocketBoxen(`Released ${c.green(nextVersion)}`)),
    ],
    { exitIfNo: true }
  )

  await cleanUpTasks('patch', nextVersion)
}

/**
 * @param {string} branch
 */
async function branchExists(branch) {
  const gitBranchPO = await $`git branch`

  const branches = gitBranchPO.stdout
    .trim()
    .split('\n')
    .map((branch) => branch.trim())

  if (branches.includes(branch)) {
    return true
  }

  return false
}

function checkoutExisting(releaseBranch) {
  return confirmRuns(
    ask`Ok to checkout existing release branch ${releaseBranch}?`,
    () => $`git checkout ${releaseBranch}`,
    { exitIfNo: true }
  )
}

/**
 * @param {string} nextVersion
 */
function cleanInstallUpdate(nextVersion) {
  return confirmRuns(
    ask`Ok to clean, install, and update package versions?`,
    [
      () => $`git clean -fxd`,
      () => $`yarn install`,
      () => $`./tasks/update-package-versions ${nextVersion}`,
    ],
    { exitIfNo: true }
  )
}

function confirmPackageVersions() {
  return confirm(
    check`The package versions have been updated. Everything look ok?`,
    { exitIfNo: true }
  )
}

/**
 * @param {string} nextVersion
 */
function commitTagQA(nextVersion) {
  return confirmRuns(
    ask`Ok to commit, tag, and run through local QA?`,
    [
      () => $`git commit -am "${nextVersion}"`,
      () => $`git tag -am ${nextVersion} "${nextVersion}"`,
      () => $`yarn build`,
      () => $`yarn lint`,
      () => $`yarn test`,
    ],
    {
      exitIfNo: true,
    }
  )
}

/**
 * @param {string} branch
 */
async function branchExistsOnOrigin(branch) {
  const { stdout } =
    await $`git ls-remote --heads git@github.com:redwoodjs/redwood ${branch}`

  if (stdout.length) {
    return true
  }

  return false
}

/**
 * @param {string} message
 */
function rocketBoxen(message) {
  return boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: {
      bottomLeft: '🚀',
      bottomRight: '🚀',
      horizontal: '—',
      topLeft: '🚀',
      topRight: '🚀',
      vertical: '🚀',
    },
  })
}

/**
 *
 * @param {string} nextVersion
 */
async function cleanUpTasks(semver, nextVersion) {
  await confirmRuns(ask`Ok to generate release notes?`, () =>
    generateReleaseNotes(nextVersion)
  )
  if (milestone) {
    await confirmRuns(ask`Ok to close milestone ${nextVersion}?`, () =>
      closeMilestone(milestone.number)
    )
  }
  await confirm(check`Did you merge the release branch into main?`)
  await confirm(check`Did you update yarn.lock?`)
  if (semver === 'major' || semver === 'minor') {
    await confirmRuns(ask`Ok to version the docs?`, () =>
      versionDocs(nextVersion)
    )
  }
  await $`open https://github.com/redwoodjs/redwood/branches`
  await confirm(check`Did you delete the release branch?`)
  await confirm(check`Did you tweet about it`)
  await confirm(check`Did you post in Discord announcements?`)
}

/**
 *
 * @param {string} nextVersion
 */
export async function versionDocs(nextVersion) {
  if (nextVersion.startsWith('v')) {
    nextVersion = nextVersion.slice(1)
  }

  if (nextVersion.split('.').length === 3) {
    nextVersion = nextVersion.slice(0, -2)
  }

  await cd('./docs')
  await $`yarn`
  await $`yarn clear`
  await $`yarn docusaurus docs:version ${nextVersion}`
  await $`git add .`
  await $`git commit -m "Version docs to ${nextVersion}"`
  await cd('../')
}
