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
 * You'll need a GitHub token and an NPM token. (So only @thedavidprice can do this right now.)
 *
 * @remarks
 *
 * - handle the case where a branch already exists; start on the "update package versions" step
 * - at this point, consider using xstate
 */
import c from 'ansi-colors'
import notifier from 'node-notifier'
import { $ } from 'zx'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import octokit from './octokit.mjs'
import {
  promptForSemver,
  confirm,
  confirmRuns,
  exitOnCancelPrompts,
  ask,
  check,
  fix,
  ok,
  rocketBoxen,
} from './prompts.mjs'
import updateNextReleasePullRequestsMilestone, {
  closeMilestone,
} from './updateNextReleasePullRequestsMilestone.mjs'

let milestone

export default async function release() {
  const semver = await promptForSemver()
  let [currentVersion, nextVersion] = await getCurrentAndNextVersions(semver)

  await validateGitTag(nextVersion)
  await validateMergedPRs(semver)

  milestone = await confirmRuns(
    ask`Do you want to update next-release PRs' milestone to ${nextVersion}?`,
    () => updateNextReleasePullRequestsMilestone(nextVersion)
  )

  // Do the release.
  switch (semver) {
    case 'major':
      console.log(c.bold(fix`Wait till after v1`))
      break
    case 'minor':
      await releaseMinor(nextVersion)
      break
    case 'patch':
      await releasePatch(currentVersion, nextVersion)
      break
  }
}

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
 * @param {string} currentVersion
 */
function getNextVersion(semver, currentVersion) {
  switch (semver) {
    case 'major': {
      const [major] = parseGitTag(currentVersion)
      return `v${[major + 1, 0, 0].join('.')}`
    }
    case 'minor': {
      const [major, minor] = parseGitTag(currentVersion)
      return `v${[major, minor + 1, 0].join('.')}`
    }
    case 'patch': {
      const [major, minor, patch] = parseGitTag(currentVersion)
      return `v${[major, minor, patch + 1].join('.')}`
    }
  }
}

/**
 * @param {Semver} semver
 * @returns {[string, string]}
 */
async function getCurrentAndNextVersions(semver) {
  // Get the most-recent tag and get the next version from it.
  // `git describe --abbrev=0` should output something like like `v0.42.1`.
  const gitDescribePO = await $`git describe --abbrev=0`
  const currentVersion = gitDescribePO.stdout.trim()
  let nextVersion = getNextVersion(semver, currentVersion)

  // Confirm that we got the next version right.
  // Give the user a chance to correct it if we didn't.
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

  return [currentVersion, nextVersion]
}

// Validation

/**
 * Check that the git tag doesn't already exist.
 *
 * @param {string} nextVersion
 */
async function validateGitTag(nextVersion) {
  const gitTagPO = await $`git tag -l ${nextVersion}`

  if (!gitTagPO.stdout.trim()) {
    return
  }

  console.log(
    c.bold(
      fix`Git tag ${nextVersion} already exists locally. You must resolve this before proceeding`
    )
  )

  process.exit(1)
}

/**
 * Check that there's no merged PRs without a milestone
 *
 * @remarks
 *
 * If we're not releasing a patch, check that there's no merged PRs with next-release-patch
 *
 * @param {Semver} semver
 */
async function validateMergedPRs(semver) {
  const {
    search: { nodes: pullRequests },
  } = await octokit.graphql(MERGED_PRS_NO_MILESTONE)

  if (pullRequests.length) {
    console.log(
      c.bold(
        fix`There shouldn't be any merged PRs without a milestone. You must resolve this before proceeding: https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+no%3Amilestone`
      )
    )
    process.exit(1)
  }

  console.log(c.bold(ok`No PRs without a milestone`))

  // If we're releasing a patch, we're done.
  // But if we're not, check that there's no PRs with the next-release-patch milestone.
  if (semver === 'patch') {
    return
  }

  const {
    search: { nodes: nextReleasePatchPullRequests },
  } = await octokit.graphql(MERGED_PRS_NEXT_RELEASE_PATCH_MILESTONE)

  if (!nextReleasePatchPullRequests.length) {
    console.log(c.bold(ok`No PRs with the next-release-patch milestone`))
    return
  }

  console.log(
    c.bold(
      fix`If you're not releasing a patch, there shouldn't be any merged PRs with the next-release-patch milestone. You must resolve this before proceeding: https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+milestone%3Anext-release-patch`
    )
  )

  process.exit(1)
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

/**
 * Right now releasing a major is the same as releasing a minor.
 *
 * @param {string} nextVersion
 */
// function releaseMajor(nextVersion) {
//   return eleaseMajorOrMinor('major', nextVersion)
// }

/**
 * @param {string} nextVersion
 */
function releaseMinor(nextVersion) {
  return releaseMajorOrMinor('minor', nextVersion)
}

/**
 * @param {Semver} semver
 * @param {string} nextVersion
 */
async function releaseMajorOrMinor(semver, nextVersion) {
  // Checkout main.
  const currentBranchPO = await $`git branch --show-current`
  const currentBranch = currentBranchPO.stdout.trim()
  if (currentBranch !== 'main') {
    await $`git checkout main`
  }

  const releaseBranch = ['release', semver, nextVersion].join('/')
  // In the future we'll expand the control flow on whether the branch exists or not:
  // await releaseBranchExists(releaseBranch)
  const runsCheckout = await confirmRuns(
    ask`Ok to checkout new branch ${releaseBranch}?`,
    () => $`git checkout -b ${releaseBranch}`
  )
  if (!runsCheckout) {
    return
  }

  const proceedOk = await confirm(
    ask`Checked out new release branch ${releaseBranch}.\nContinue to publish or stop here to push this branch to GitHub to create an RC`
  )
  if (!proceedOk) {
    return
  }

  const runsCleanInstallUpdate = await cleanInstallUpdate(nextVersion)
  if (!runsCleanInstallUpdate) {
    return
  }
  notifier.notify('done')

  const versionsOk = await confirm(
    check`The package versions have been updated. Does everything look ok?`
  )
  if (!versionsOk) {
    return
  }

  const runsCommitTagQA = await commitTagQA(nextVersion)
  if (!runsCommitTagQA) {
    return
  }
  notifier.notify('done')

  const releaseOk = await confirm(
    ask`Everything passed local QA. Are you ready to push your branch to GitHub and publish to NPM?`
  )
  if (!releaseOk) {
    return
  }

  await $`git push && git push --tags`
  try {
    await $`yarn lerna publish from-package`
    console.log(rocketBoxen(`Released ${c.green(nextVersion)}`))
  } catch (e) {
    console.log("Couldn't run yarn lerna publish from-package")
    console.log(e)
  }

  await confirmRuns(ask`Do you want to generate release notes?`, () =>
    generateReleaseNotes(nextVersion)
  )

  if (milestone) {
    await confirmRuns(ask`Ok to close milestone ${nextVersion}?`, () =>
      closeMilestone(milestone.number)
    )
  }
}

/**
 * Check if the release branch already exists.
 * If it does, offer to check it out. Otherwise, offer to create it.
 *
 * @param {string} releaseBranch
 */
// async function releaseBranchExists(releaseBranch) {
//   const gitBranchPO = await $`git branch`

//   const branches = gitBranchPO.stdout
//     .trim()
//     .split('\n')
//     .map((branch) => branch.trim())

//   if (branches.includes(releaseBranch)) {
//     return true
//   }

//   return false
// }

/**
 * This is a WIP.
 *
 * @param {string} nextVersion
 */
async function releasePatch(currentVersion, nextVersion) {
  const previousReleaseBranch = ['tag', currentVersion].join('/')
  const releaseBranch = ['release', 'patch', nextVersion].join('/')

  const runsCheckout = await confirmRuns(
    ask`Ok to checkout new branch ${releaseBranch} from ${previousReleaseBranch}?`,
    () => $`git checkout ${previousReleaseBranch} -b ${releaseBranch}`
  )
  if (!runsCheckout) {
    return
  }

  let runsPushAndDiff = await pushAndDiff(releaseBranch, currentVersion)
  if (!runsPushAndDiff) {
    return
  }

  let diffOk = await confirm('Does the diff look ok?')
  if (!diffOk) {
    console.log('todo: resetting...')
    // delete remote?
    return
  }

  const proceedOk = await confirm(
    ask`Cherry pick and handle the conflicts—tell me when you're done`
  )
  if (!proceedOk) {
    console.log('todo: resetting...')
    return
  }

  runsPushAndDiff = await runsPushAndDiff(releaseBranch, currentVersion)
  if (!runsPushAndDiff) {
    return
  }

  diffOk = await confirm('Does the diff look ok?')
  if (!diffOk) {
    console.log('todo: resetting...')
    return
  }

  const runsCleanInstallUpdate = await cleanInstallUpdate(nextVersion)
  if (!runsCleanInstallUpdate) {
    return
  }
  notifier.notify('done')

  const versionsOk = await confirm(
    check`The package versions have been updated. Does everything look right?`
  )
  if (!versionsOk) {
    return
  }

  const runsCommitTagQA = await commitTagQA(nextVersion)
  if (!runsCommitTagQA) {
    return
  }
  notifier.notify('done')

  // Merge commit
  // await $`git checkout main`
  // await $`git branch -d release/patch/${nextVersion}`
}

/**
 * @param {string} nextVersion
 */
function cleanInstallUpdate(nextVersion) {
  return confirmRuns(ask`Ok to clean, install, and update package versions?`, [
    () => $`git clean -fxd`,
    () => $`yarn install`,
    () => $`./tasks/update-package-versions ${nextVersion}`,
  ])
}

/**
 * @param {string} nextVersion
 */
function commitTagQA(nextVersion) {
  return confirmRuns(ask`Ok to commit, tag, and run through local QA?`, [
    () => $`git commit -am "${nextVersion}"`,
    () => $`git tag -am ${nextVersion} "${nextVersion}"`,
    () => $`yarn build`,
    () => $`yarn lint`,
    () => $`yarn test`,
  ])
}

/**
 * @param {string} releaseBranch
 * @param {string} currentVersion
 */
function pushAndDiff(releaseBranch, currentVersion) {
  return confirmRuns(
    ask`Ok to push new branch ${releaseBranch} and open diff?`,
    [
      () => $`git push origin ${releaseBranch}`,
      () =>
        $`open https://github.com/redwoodjs/redwood/compare/${currentVersion}..${releaseBranch}`,
    ]
  )
}
