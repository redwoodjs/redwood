/* eslint-env node */

import { fileURLToPath } from 'node:url'

import boxen from 'boxen'
import { Octokit } from 'octokit'
import { rimraf } from 'rimraf'
import { cd, chalk, question, $, fs } from 'zx'

import { handler as generateReleaseNotes } from './generateReleaseNotesCommand.mjs'
import {
  getLatestRelease,
  getMilestone,
  logSection,
  prompts,
  isYes,
} from './releaseLib.mjs'

let octokit
let semver
let currentVersion
let nextVersion
let milestone
let releaseBranch

const compareURL = 'https://github.com/redwoodjs/redwood/compare'

export const command = 'release'
export const description = 'Release a major, minor, or patch'

export async function handler() {
  if (process.env.GITHUB_TOKEN === undefined) {
    console.log('You have to set the GITHUB_TOKEN env var')

    process.exitCode = 1
    return
  }

  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  // ------------------------
  logSection('Asking for the semver\n')

  const semverPromptResponse = await prompts({
    name: 'semver',
    type: 'select',
    message: 'Which semver are you releasing?',
    choices: [{ value: 'major' }, { value: 'minor' }, { value: 'patch' }],
    initial: 2,
  })

  semver = semverPromptResponse.semver

  // ------------------------
  logSection('Getting the latest release\n')

  currentVersion = await getLatestRelease()
  console.log()

  exitIfNo(
    await question(
      `The latest release is ${chalk.magenta(currentVersion)}? [Y/n] > `
    )
  )

  // ------------------------
  logSection('Confirming the next release\n')

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

  exitIfNo(
    await question(
      `The next release is ${chalk.magenta(nextVersion)}? [Y/n] > `
    )
  )

  milestone = await getMilestone.call({ octokit }, nextVersion)

  // ------------------------
  logSection("Checking that the git tag doesn't already exist\n")

  if (await doesGitTagExist(nextVersion)) {
    console.log(
      `\nGit tag ${chalk.magenta(
        nextVersion
      )} already exists locally. You have to fix this before continuing`
    )

    process.exitCode = 1
    return
  }

  // ------------------------
  logSection('Checking milestones\n')

  const {
    search: { nodes: prs },
  } = await octokit.graphql(getPRsisMergedNoMilestoneQuery)

  if (prs.length) {
    console.log(
      "There shouldn't be any merged PRs without a milestone. You have to fix this before continuing"
    )

    if (
      isYes(await question('Open merged PRs without a milestone? [Y/n] > '))
    ) {
      await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+no%3Amilestone`
    }

    process.exit(1)
  }

  if (semver === 'patch') {
    exitIfNo(
      await question(
        `Did you update the milestones of the PRs you plan to include in the patch to ${chalk.magenta(
          'next-release-patch'
        )}? [Y/n] > `
      )
    )
  } else {
    const {
      search: { nodes: prs },
    } = await octokit.graphql(getPRsisMergedMilestoneNextReleasePatchQuery)

    if (prs.length) {
      console.log(
        `If you're not releasing a patch, there shouldn't be any merged PRs with the ${chalk.magenta(
          'next-release-patch'
        )} milestone. You have to fix this before continuing`
      )
      console.log()

      if (
        isYes(
          await question(
            `Open merged PRs with ${chalk.magenta(
              'next-release-patch'
            )} milestone? [Y/n] > `
          )
        )
      ) {
        await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+milestone%3Anext-release-patch`
      }

      process.exit(1)
    }
  }

  const fromTitle = 'next-release' + (semver === 'patch' ? '-patch' : '')
  const { id: fromMilestoneId } = await getMilestone.call(
    { octokit },
    fromTitle
  )
  const milestonePRs = await getMilestonePRs.call({ octokit }, fromMilestoneId)

  if (milestonePRs.length) {
    logSection('Updating milestones\n')

    if (
      isYes(
        await question(
          `Ok to update ${
            milestonePRs.length
          } PRs' milestone from ${chalk.magenta(fromTitle)} to ${chalk.magenta(
            nextVersion
          )}? [Y/n] > `
        )
      )
    ) {
      if (!milestone) {
        milestone = await createMilestone.call({ octokit }, nextVersion)
      }

      console.log()

      await Promise.all(
        milestonePRs.map((milestonePR) => {
          process.stdout.write(
            `Updating #${milestonePR.number} ${milestonePR.title}\n`
          )
          return updatePRMilestone.call(
            { octokit },
            milestonePR.id,
            milestone.id
          )
        })
      )
    }
  }

  // ------------------------
  switch (semver) {
    case 'major':
    case 'minor':
      await releaseMajorOrMinor()
      break
    case 'patch':
      await releasePatch()
      break
  }
}

// ------------------------
// Helpers
// ------------------------

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

/** @param {string} tag */
async function doesGitTagExist(tag) {
  return (await $`git tag -l ${tag}`).stdout.trim()
}

const getPRsisMergedNoMilestoneQuery = `
  query GetPRsisMergedNoMilestoneQuery {
    search(
      query: "repo:redwoodjs/redwood is:pr is:merged no:milestone"
      first: 5
      type: ISSUE
    ) {
      nodes {
        ... on PullRequest {
          id
        }
      }
    }
  }
`

const getPRsisMergedMilestoneNextReleasePatchQuery = `
  query GetPRsisMergedMilestoneNextReleasePatchQuery {
    search(
      query: "repo:redwoodjs/redwood is:pr is:merged milestone:next-release-patch"
      first: 5
      type: ISSUE
    ) {
      nodes {
        ... on PullRequest {
          id
        }
      }
    }
  }
`

async function createMilestone(title) {
  const {
    data: { node_id: id, number },
  } = await this.octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title,
  })

  return { title, id, number }
}

async function getMilestonePRs(milestoneId) {
  const {
    node: {
      pullRequests: { nodes },
    },
  } = /** @type {GetPullRequestIdsRes} */ (
    await this.octokit.graphql(getPRIdsQuery, {
      milestoneId,
    })
  )

  return nodes
}

const getPRIdsQuery = `
  query GetPRIdsQuery($milestoneId: ID!) {
    node(id: $milestoneId) {
      ... on Milestone {
        pullRequests(first: 100) {
          nodes {
            number
            title
            id
          }
        }
      }
    }
  }
`

function updatePRMilestone(prId, milestoneId) {
  return this.octokit.graphql(updatePRMilestoneMutation, {
    pullRequestId: prId,
    milestoneId,
  })
}

const updatePRMilestoneMutation = `
  mutation UpdatePRMilestone($pullRequestId: ID!, $milestoneId: ID!) {
    updatePullRequest(
      input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
    ) {
      clientMutationId
    }
  }
`

async function releaseMajorOrMinor() {
  logSection('Checking if the release branch exists\n')

  releaseBranch = ['release', semver, nextVersion].join('/')

  const releaseBranchExists = await branchExists(releaseBranch)
  console.log()

  const checkoutFromBranch = semver === 'major' ? 'main' : 'next'

  if (releaseBranchExists) {
    console.log(
      `Checking out existing release branch ${chalk.magenta(releaseBranch)}\n`
    )

    await $`git checkout ${releaseBranch}`
    console.log()
  } else {
    exitIfNo(
      await question(
        `Ok to checkout new branch ${chalk.magenta(
          releaseBranch
        )} from ${chalk.magenta(checkoutFromBranch)}? [Y/n] > `
      )
    )
    console.log()

    await $`git checkout -b ${releaseBranch} ${checkoutFromBranch}`
    console.log()
  }

  exitIfNo(
    await question(
      `Ok to continue to publish? (Say no here if you want to push this branch to GitHub to create an RC) [Y/n] > `
    ),
    { code: 0 }
  )
  console.log()

  await versionDocs()
  console.log()
  await cleanInstallUpdate()
  console.log()
  await runQA(nextVersion)
  console.log()

  exitIfNo(
    await question(
      `Everything passed local QA. Ok to push to GitHub and publish to NPM? [Y/n] > `
    )
  )
  console.log()

  // Temporarily remove `"packages/create-redwood-app"` from the workspaces field
  // so that we can publish it separately later.
  //  ------------------------
  const frameworkPackageConfigPath = fileURLToPath(
    new URL('../../package.json', import.meta.url)
  )

  const frameworkPackageConfig = fs.readJSONSync(frameworkPackageConfigPath)

  const packagePaths = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter(({ name }) => name)
    .map(({ location }) => location)

  frameworkPackageConfig.workspaces = packagePaths.filter(
    (packagePath) => packagePath !== 'packages/create-redwood-app'
  )

  fs.writeJSONSync(frameworkPackageConfigPath, frameworkPackageConfig, {
    spaces: 2,
  })

  await $`git commit -am "chore: temporary update to workspaces"`
  console.log()

  await removeTSConfigTSBuildInfo()

  //  ------------------------
  try {
    await $`yarn lerna publish from-package`
  } catch (_error) {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  await $`git reset --hard HEAD~1`
  console.log()

  //  ------------------------
  await updateCreateRedwoodAppTemplates()
  console.log()

  await $`yarn lerna publish from-package`
  console.log()

  await $`git reset --soft HEAD~2`
  await $`git commit -m "${nextVersion}"`
  await $`git tag -am ${nextVersion} "${nextVersion}"`
  await $`git push --tags`

  console.log(rocketBoxen(`Released ${chalk.green(nextVersion)}`))

  // ------------------------
  logSection('Generating release notes\n')

  await generateReleaseNotes({ milestone: milestone?.title ?? nextVersion })

  if (milestone) {
    await closeMilestone.call({ octokit }, milestone.number)
  }

  // ------------------------
  logSection('Showing remaining steps\n')

  console.log(
    [
      'Only a few more things to do:',
      '',
      '  - Remove the yarn.lock files in the create-redwood-app templates',
      '  - Merge the release branch into next (updating yarn.lock if necessary) and push',
      '  - Once the docs are done deploying (check here https://app.netlify.com/sites/redwoodjs-docs/overview), start the algolia crawler at https://crawler.algolia.com/admin',
      '  - Delete the release branch locally and on https://github.com/redwoodjs/redwood/branches',
      '  - Post on Discord and Twitter',
    ].join('\n')
  )
}

/**
 * @param {string} nextVersion
 */
async function releasePatch() {
  logSection('Checking if the release branch exists\n')

  releaseBranch = ['release', 'patch', nextVersion].join('/')

  const releaseBranchExists = await branchExists(releaseBranch)
  console.log()

  if (releaseBranchExists) {
    console.log(
      `Checking out existing release branch ${chalk.magenta(releaseBranch)}\n`
    )

    await $`git checkout ${releaseBranch}`
    console.log()
  } else {
    exitIfNo(
      await question(
        `Ok to checkout new branch ${chalk.magenta(
          releaseBranch
        )} from ${chalk.magenta(currentVersion)} tag? [Y/n] > `
      )
    )
    console.log()

    await $`git checkout -b ${releaseBranch} ${currentVersion}`
    console.log()
  }

  if (!(await branchExistsOnOrigin(releaseBranch))) {
    logSection('Pushing to redwoodjs/redwood\n')

    exitIfNo(
      await question(
        `Ok to push new branch ${chalk.magenta(
          releaseBranch
        )} to GitHub and open diff? [Y/n] > `
      )
    )
    console.log()

    await $`git push -u origin ${releaseBranch}`
    console.log()

    await $`open ${compareURL}/${currentVersion}...${releaseBranch}`
    console.log()

    exitIfNo(await question('Diff look ok? [Y/n] > '))

    // ------------------------
    logSection('Cherry picking PRs\n')
    console.log(
      [
        "Remember to cherry pick PRs _in the same order as they were merged_. And after you're done, run:",
        '  1. yarn (to update the lock file), and',
        '  2. yarn check',
        '',
      ].join('\n')
    )

    exitIfNo(await question(`Done cherry picking? [Y/n] > `))
    console.log()

    await pushAndDiff()
  }

  await cleanInstallUpdate()
  console.log()

  await runQA()
  console.log()

  exitIfNo(
    await question(`Everything passed local QA. Ok to publish to NPM? [Y/n] > `)
  )
  console.log()

  // Temporarily remove `"packages/create-redwood-app"` from the workspaces field
  // so that we can publish it separately later.
  //  ------------------------
  const frameworkPackageConfigPath = fileURLToPath(
    new URL('../../package.json', import.meta.url)
  )

  const frameworkPackageConfig = fs.readJSONSync(frameworkPackageConfigPath)

  const packagePaths = (await $`yarn workspaces list --json`).stdout
    .trim()
    .split('\n')
    .map(JSON.parse)
    .filter(({ name }) => name)
    .map(({ location }) => location)

  frameworkPackageConfig.workspaces = packagePaths.filter(
    (packagePath) => packagePath !== 'packages/create-redwood-app'
  )

  fs.writeJSONSync(frameworkPackageConfigPath, frameworkPackageConfig, {
    spaces: 2,
  })

  await $`git commit -am "chore: temporary update to workspaces"`
  console.log()

  await removeTSConfigTSBuildInfo()

  //  ------------------------
  try {
    await $`yarn lerna publish from-package`
  } catch (_error) {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  await $`git reset --hard HEAD~1`
  console.log()

  //  ------------------------
  await updateCreateRedwoodAppTemplates()
  console.log()

  await $`yarn lerna publish from-package`
  console.log()

  await $`git reset --soft HEAD~2`
  await $`git commit -m "${nextVersion}"`
  await $`git tag -am ${nextVersion} "${nextVersion}"`
  await $`git push`
  await $`git push --tags`

  console.log(rocketBoxen(`Released ${chalk.green(nextVersion)}`))

  // ------------------------
  logSection('Generating release notes\n')

  await generateReleaseNotes({ milestone: milestone?.title ?? nextVersion })

  if (milestone) {
    await closeMilestone.call({ octokit }, milestone.number)
  }

  // ------------------------
  logSection('Showing remaining steps\n')

  console.log(
    [
      'Only a few more things to do:',
      '',
      '  - Remove the yarn.lock files in the create-redwood-app templates',
      '  - Merge the release branch into next (updating yarn.lock if necessary)',
      '  - Push',
      '  - Delete the release branch locally and on https://github.com/redwoodjs/redwood/branches',
      '  - Post on discord and twitter',
    ].join('\n')
  )
}

/**
 * @param {string} branch
 */
async function branchExists(branch) {
  return !!(await $`git branch -l ${branch}`).stdout.trim()
}

async function cleanInstallUpdate() {
  logSection('Cleaning, installing, and updating package versions\n')

  exitIfNo(
    await question(
      `Ok to clean, install, and update package versions? [Y/n] > `
    )
  )
  console.log()

  await $`git clean -fxd`
  await $`yarn install`
  await $`./tasks/update-package-versions ${nextVersion}`
  await $`yarn install`

  logSection('Confirming package versions\n')

  exitIfNo(
    await question(
      `The package versions have been updated. Everything look ok? [Y/n] > `
    )
  )
  console.log()

  await $`git commit -am "chore: update package versions to ${nextVersion}"`
}

async function runQA() {
  logSection('Running QA\n')

  exitIfNo(await question(`Ok to run local QA? [Y/n] > `))
  console.log()

  await $`yarn build`
  await $`yarn lint`
  await $`yarn test`
}

/**
 * @param {string} branch
 */
async function branchExistsOnOrigin(branch) {
  return !!(
    await $`git ls-remote --heads git@github.com:redwoodjs/redwood ${branch}`
  ).stdout.length
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

function closeMilestone(number) {
  return this.octokit.request(
    'POST /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      milestone_number: number,
      state: 'closed',
      due_on: new Date().toISOString(),
    }
  )
}

async function updateCreateRedwoodAppTemplates() {
  logSection('Updating create-redwood-app templates\n')

  if (
    !isYes(
      await question('Ok to update create-redwood-app templates? [Y/n] > ')
    )
  ) {
    return
  }
  console.log()

  cd('./packages/create-redwood-app/templates/ts')
  await $`rm -f yarn.lock`
  await $`touch yarn.lock`
  await $`yarn install`

  cd('../..')
  await $`yarn ts-to-js`
  await $`git add .`
  await $`git commit -m "chore: update create-redwood-app templates"`
  cd('../..')
}

async function exitIfNo(question, { code } = { code: 1 }) {
  if (isYes(question)) {
    return
  }

  process.exit(code)
}

async function pushAndDiff() {
  exitIfNo(
    await question(
      `Ok to push branch ${chalk.magenta(
        releaseBranch
      )} to GitHub and open diff? [Y/n] > `
    )
  )
  console.log()

  await $`git push`
  console.log()

  await $`open ${compareURL}/${currentVersion}...${releaseBranch}`
  console.log()

  exitIfNo(await question(`Diff look ok? [Y/n] > `))
}

async function versionDocs() {
  logSection('Versioning docs\n')

  if (
    !isYes(
      await question(
        `Ok to version docs to ${chalk.magenta(nextVersion)}? [Y/n] > `
      )
    )
  ) {
    return
  }
  console.log()

  const nextDocsVersion = nextVersion.slice(1, -2)

  await cd('./docs')
  await $`yarn`
  await $`yarn clear`
  await $`yarn docusaurus docs:version ${nextDocsVersion}`
  await $`git add .`
  await $`git commit -m "Version docs to ${nextDocsVersion}"`
  await cd('../')
}

async function removeTSConfigTSBuildInfo() {
  await rimraf('packages/**/dist/tsconfig.tsbuildinfo')
}
