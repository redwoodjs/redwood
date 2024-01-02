/* eslint-env node */

import { fileURLToPath } from 'node:url'
import { parseArgs as _parseArgs } from 'node:util'

import execa from 'execa'
import semverPackage from 'semver'
import { cd, chalk, fs, path, question, $ } from 'zx'

import {
  branchExists,
  branchExistsOnRedwoodRemote,
  consoleBoxen,
  getOctokit,
  getLatestRelease,
  getMilestones,
  getPRsWithMilestone,
  getRedwoodRemote,
  getSpinner,
  isYes,
  prompts,
  unwrap,
  setVerbosity,
  findUp,
} from './releaseLib.mjs'

let octokit
let semver
let latestRelease
let nextRelease
let milestone
let releaseBranch
let redwoodRemote

const compareURL = 'https://github.com/redwoodjs/redwood/compare'

export async function main() {
  const options = parseArgs()

  const { verbose } = options
  setVerbosity(verbose)

  try {
    await doChecks()
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }

  try {
    // We'll be making requests to GitHub for PRs. While this data isn't private, we could get rate-limited without a token.
    octokit = await getOctokit()

    const result = await getRedwoodRemote()
    $.verbose && console.log()

    if (result.error) {
      throw new Error(result.error)
    }

    redwoodRemote = result.redwoodRemote
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }

  const semverPromptRes = await prompts({
    name: 'semver',
    message: 'Which semver do you want to release?',
    type: 'select',

    choices: [{ value: 'major' }, { value: 'minor' }, { value: 'patch' }],
    // `initial` is set to `patch` because that's the most common.
    initial: 2,
  })

  semver = semverPromptRes.semver

  latestRelease = await getLatestRelease()

  exitIfNo(
    await question(
      `The latest release is ${chalk.magenta(latestRelease)}? [Y/n] > `
    )
  )

  nextRelease = `v${semverPackage.inc(latestRelease, semver)}`

  exitIfNo(
    await question(
      `The next release is ${chalk.magenta(nextRelease)}? [Y/n] > `
    )
  )

  // If the git tag for the desired semver already exists, this script was run before, but not to completion.
  // The git tag is one of the last steps, so we need it to be deleted first.
  const gitTagAlreadyExists = unwrap(await $`git tag -l ${nextRelease}`)

  if (gitTagAlreadyExists) {
    consoleBoxen(
      '🐙 The git tag already exists',
      [
        `The git tag ${chalk.magenta(
          nextRelease
        )} already exists locally. You have to fix this before continuing.`,
        "here's how you fix it...",
      ].join('\n')
    )

    process.exitCode = 1
    return
  }

  // We use milestones to keep track of where commits are supposed to land in a release. Let's double check that everything lines up.
  await resolveMilestones()
  console.log()

  console.log(
    'If you want to use `yarn release:notes` to generate release notes, now would be a good time to do so.'
  )
  await question(
    "Press any key to continue when you're done with the release notes > "
  )

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

main()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function doChecks() {
  const nodeVersion = unwrap(await $`node -v`)

  if (!nodeVersion.startsWith('v20')) {
    throw new Error(
      [
        'The framework is currently built for Node v20; running QA with any ' +
          'other version may cause issues.',
        'Please switch to Node v20.',
      ].join('\n')
    )
  }
}

function parseArgs() {
  const { values } = _parseArgs({
    options: {
      verbose: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
    },
  })

  return values
}

// ─── Milestone Helpers ───────────────────────────────────────────────────────

async function resolveMilestones() {
  // Handle PRs that have been merged without a milestone. We have a check in CI for this, so it really shouldn't happen.
  // But if it does, we handle it here.
  const {
    search: { nodes: mergedPRsNoMilestone },
  } = await octokit.graphql(`
    {
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
  `)

  if (mergedPRsNoMilestone.length) {
    console.log(
      [
        '',
        '🤔 It looks like there are some PRs that were merged without a milestone.',
        'Since we use milestones to indicate which release a PR is supposed to land in, this could be a problem. 😬',
        '',
      ].join('\n')
    )

    await question(
      'Press anything to open PRs that were merged without a milestone > '
    )
    await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+no%3Amilestone`
    await question(
      'Take some time to fix this, then press anything to continue > '
    )
  }

  // Depending on if we're releasing a patch or not, there's a few things we need to check.
  const {
    search: { nodes: prs },
  } = await octokit.graphql(`
      {
        search(
          query: "repo:redwoodjs/redwood is:pr is:merged milestone:next-release-patch"
          first: 51
          type: ISSUE
        ) {
          nodes {
            ... on PullRequest {
              id
            }
          }
        }
      }
    `)

  if (semver === 'patch') {
    const prettyPatch = chalk.magenta('next-release-patch')
    const singularMsg = `There's 1 PR that has the ${prettyPatch} milestone.`
    const pluralMsg =
      prs.length <= 50
        ? `There are ${prs.length} PRs that have the ${prettyPatch} milestone.`
        : `There are more than 50 PRs that have the ${prettyPatch} milestone.`
    console.log()
    console.log(prs.length === 1 ? singularMsg : pluralMsg)

    if (
      !isYes(
        await question(
          `Did you update the milestone of the PRs you plan to include in the patch to ${chalk.magenta(
            'next-release-patch'
          )}? [Y/n] > `
        )
      )
    ) {
      await question('Press anything to open a view of all the milestones > ')
      await $`open https://github.com/redwoodjs/redwood/milestones`
      await question(
        `Take some time to fix this, then press anything to continue > `
      )
    }
  } else {
    if (prs.length) {
      console.log()
      console.log(
        `If you're not releasing a patch, there probably shouldn't be any merged PRs with the ${chalk.magenta(
          'next-release-patch'
        )} milestone.`
      )

      await question(
        `Press anything to open merged PRs with the ${chalk.magenta(
          'next-release-patch'
        )} milestone > `
      )
      await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+milestone%3Anext-release-patch`
      await question(
        `Take some time to fix this, then press anything to continue > `
      )
    }
  }

  // Now that all our ducks are in a row, we can change the milestone of the PRs we're releasing to the release milestone.
  // If we're releasing a patch, the "from" milestone is `next-release-patch`. Otherwise, it's `next-release`.
  const fromTitle = ['next-release', semver === 'patch' && 'patch']
    .filter(Boolean)
    .join('-')

  const fromTitlePRs = await getPRsWithMilestone(fromTitle)

  if (fromTitlePRs.length) {
    if (
      isYes(
        await question(
          `Ok to update ${
            fromTitlePRs.length
          } PRs' milestone from ${chalk.magenta(fromTitle)} to ${chalk.magenta(
            nextRelease
          )}? [Y/n] > `
        )
      )
    ) {
      const milestones = await getMilestones()
      milestone = milestones.find(({ title }) => title === nextRelease)

      if (!milestone) {
        milestone = await createMilestone(nextRelease)
      }

      console.log()

      await Promise.all(
        fromTitlePRs.map((milestonePR) => {
          process.stdout.write(
            `Updating #${milestonePR.number} ${milestonePR.title}\n`
          )
          return updatePRMilestone(milestonePR.id, milestone.id)
        })
      )
    }
  }
}

/**
 * @param {string} title
 */
async function createMilestone(title) {
  // There's no GraphQL mutation for this.
  const {
    data: { node_id: id, number },
  } = await octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title,
  })

  return { title, id, number }
}

function updatePRMilestone(prId, milestoneId) {
  return octokit.graphql(
    `
      mutation UpdatePRMilestone($pullRequestId: ID!, $milestoneId: ID!) {
        updatePullRequest(
          input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
        ) {
          clientMutationId
        }
      }
    `,
    {
      pullRequestId: prId,
      milestoneId,
    }
  )
}

// ─── Release Helpers ─────────────────────────────────────────────────────────

async function releaseMajorOrMinor() {
  releaseBranch = ['release', semver, nextRelease].join('/')
  const releaseBranchExists = await branchExists(releaseBranch)
  const checkoutFromBranch = semver === 'major' ? 'main' : 'next'

  if (releaseBranchExists) {
    console.log(
      `Checking out the existing ${chalk.magenta(releaseBranch)} release branch`
    )
    await $`git checkout ${releaseBranch}`
  } else {
    exitIfNo(
      await question(
        `Ok to checkout a new release branch, ${chalk.magenta(
          releaseBranch
        )}, from the ${chalk.magenta(checkoutFromBranch)} branch? [Y/n] > `
      )
    )
    await $`git checkout -b ${releaseBranch} ${checkoutFromBranch}`
  }

  $.verbose && console.log()
  await versionDocs()
  $.verbose && console.log()
  await cleanInstallUpdate()
  $.verbose && console.log()
  await runQA()
  $.verbose && console.log()

  exitIfNo(
    await question(`Everything passed local QA. Ok to publish to NPM? [Y/n] > `)
  )

  // Temporarily remove `packages/create-redwood-app` from the workspaces field
  // so that we can publish it separately later.
  await removeCreateRedwoodAppFromWorkspaces()
  console.log()

  // Publish.
  try {
    await execa.command('yarn lerna publish from-package', { stdio: 'inherit' })
  } catch {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  // Undo the temporary commit and publish CRWA.
  await $`git reset --hard HEAD~1`
  await updateCreateRedwoodAppTemplates()
  console.log()
  try {
    await execa.command('yarn lerna publish from-package', { stdio: 'inherit' })
  } catch {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  // Clean up commits and push. This combines the update package versions commit and update CRWA commit into one.
  await $`git reset --soft HEAD~2`
  await $`git commit -m "${nextRelease}"`
  await $`git tag -am ${nextRelease} "${nextRelease}"`
  await $`git push -u ${redwoodRemote} ${releaseBranch} --follow-tags`

  console.log()
  console.log(`🚀 Released ${chalk.green(nextRelease)}`)
  console.log()

  if (milestone) {
    await closeMilestone(milestone.number)
  }

  console.log(
    [
      'Only a few more things to do:',
      '  - publish the release notes',
      '  - merge the release branch into next and push the merge commit',
      '  - Delete the release branch locally and on GitHub (https://github.com/redwoodjs/redwood/branches)',
      '  - post on Slack, Discord, and Buffer',
    ].join('\n')
  )
}

async function versionDocs() {
  if (
    !isYes(
      await question(
        `Ok to version docs to ${chalk.magenta(nextRelease)}? [Y/n] > `
      )
    )
  ) {
    return
  }

  const nextDocsVersion = nextRelease.slice(1, -2)

  const spinner = getSpinner('Versioning docs')
  await cd('./docs')

  if (fs.existsSync(`./versioned_docs/version-${nextDocsVersion}`)) {
    await $`rm -rf ./versioned_docs/version-${nextDocsVersion}`

    const versions = await fs.readJSON('./versions.json')
    await fs.writeJSON('./versions.json', versions.slice(1))
  }

  await $`yarn`
  await $`yarn clear`
  await $`yarn docusaurus docs:version ${nextDocsVersion}`
  await $`git add .`
  await $`git commit -m "Version docs to ${nextDocsVersion}"`
  await cd('../')
  spinner.stop()
}

async function cleanInstallUpdate() {
  exitIfNo(
    await question(
      `Ok to clean, install, and update package versions? [Y/n] > `
    )
  )

  const spinner = getSpinner('Cleaning')
  await $`git clean -fxd`

  spinner.text = 'Installing'
  await $`yarn install`

  spinner.text = 'Updating package versions'

  const lernaVersion = nextRelease.replace('v', '')
  await $`yarn lerna version ${lernaVersion} --force-publish --no-push --no-git-tag-version --exact --yes`

  const cwd = path.dirname(findUp('lerna.json'))

  spinner.text = 'Updating CRWA templates...'

  const tsTemplatePath = path.join(
    cwd,
    'packages/create-redwood-app/templates/ts'
  )
  updateRWJSPkgsVersion(tsTemplatePath, lernaVersion)
  updateRWJSPkgsVersion(path.join(tsTemplatePath, 'api'), lernaVersion)
  updateRWJSPkgsVersion(path.join(tsTemplatePath, 'web'), lernaVersion)
  $.verbose && console.log()

  const jsTemplatePath = path.join(
    cwd,
    'packages/create-redwood-app/templates/js'
  )
  updateRWJSPkgsVersion(jsTemplatePath, lernaVersion)
  updateRWJSPkgsVersion(path.join(jsTemplatePath, 'api'), lernaVersion)
  updateRWJSPkgsVersion(path.join(jsTemplatePath, 'web'), lernaVersion)
  $.verbose && console.log()

  spinner.text = 'Updating test-project fixture...'

  const fixturePath = path.join(cwd, '__fixtures__/test-project')
  updateRWJSPkgsVersion(fixturePath, lernaVersion)
  updateRWJSPkgsVersion(path.join(fixturePath, 'api'), lernaVersion)
  updateRWJSPkgsVersion(path.join(fixturePath, 'web'), lernaVersion)
  $.verbose && console.log()

  spinner.text = 'Installing'
  await $`yarn install`
  spinner.stop()

  $.verbose && console.log()

  await $`git commit -am "chore: update package versions to ${nextRelease}"`
}

async function runQA() {
  exitIfNo(await question(`Ok to run local QA? [Y/n] > `))

  const spinner = getSpinner('Building')
  await $`yarn build`

  spinner.text = 'Linting'
  await $`yarn lint`

  spinner.text = 'Testing'
  await $`yarn test`
  spinner.stop()
}

async function removeCreateRedwoodAppFromWorkspaces() {
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
}

async function updateCreateRedwoodAppTemplates() {
  if (
    !isYes(
      await question('Ok to update create-redwood-app templates? [Y/n] > ')
    )
  ) {
    return
  }

  const spinner = getSpinner('Updating create-redwood-app templates')
  cd('./packages/create-redwood-app/templates/ts')
  await $`rm -f yarn.lock`
  await $`touch yarn.lock`
  await $`yarn install`

  cd('../..')
  await $`yarn ts-to-js`
  await $`git add .`
  await $`git commit -m "chore: update create-redwood-app templates"`
  cd('../..')
  spinner.stop()
}

function closeMilestone(number) {
  return octokit.request(
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

async function releasePatch() {
  releaseBranch = ['release', 'patch', nextRelease].join('/')
  const releaseBranchExists = await branchExists(releaseBranch)

  if (releaseBranchExists) {
    console.log(
      `Checking out the existing ${chalk.magenta(releaseBranch)} release branch`
    )
    await $`git checkout ${releaseBranch}`
  } else {
    exitIfNo(
      await question(
        `Ok to checkout a new release branch, ${chalk.magenta(
          releaseBranch
        )}, from the ${chalk.magenta(latestRelease)} tag? [Y/n] > `
      )
    )
    await $`git checkout -b ${releaseBranch} ${latestRelease}`
  }

  if (!(await branchExistsOnRedwoodRemote(releaseBranch, redwoodRemote))) {
    await pushAndDiff()

    console.log(
      [
        "Time to cherry pick PRs. Here's a few things to keep in mind:",
        '  - cherry pick PRs in the same order they were merged',
        '  - after cherry picking PRs that change dependencies, run `yarn && yarn check`',
      ].join('\n')
    )

    exitIfNo(await question(`Done cherry picking? [Y/n] > `))
    await pushAndDiff()

    exitIfNo(await question(`Does the diff look ok? [Y/n] > `))
    console.log()
  }

  await cleanInstallUpdate()
  $.verbose && console.log()
  await runQA()
  $.verbose && console.log()
  await versionDocs()
  $.verbose && console.log()

  exitIfNo(
    await question(`Everything passed local QA. Ok to publish to NPM? [Y/n] > `)
  )

  // Temporarily remove `packages/create-redwood-app` from the workspaces field
  // so that we can publish it separately later.
  await removeCreateRedwoodAppFromWorkspaces()
  console.log()

  // Publish.
  try {
    await execa.command('yarn lerna publish from-package', {
      stdio: 'inherit',
    })
  } catch {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  // Undo the temporary commit and publish CRWA.
  await $`git reset --hard HEAD~1`
  await updateCreateRedwoodAppTemplates()
  console.log()
  try {
    await execa.command('yarn lerna publish from-package', { stdio: 'inherit' })
  } catch {
    exitIfNo(
      await question(
        'Publishing failed. You can usually recover from this by running `yarn lerna publish from-package` again. Continue? [Y/n] > '
      )
    )
  }
  console.log()

  // Clean up commits and push. This combines the update package versions commit and update CRWA commit into one.
  await $`git reset --soft HEAD~2`
  await $`git commit -m "${nextRelease}"`
  await $`git tag -am ${nextRelease} "${nextRelease}"`
  await $`git push -u ${redwoodRemote} ${releaseBranch} --follow-tags`

  console.log()
  console.log(`🚀 Released ${chalk.green(nextRelease)}`)
  console.log()

  if (milestone) {
    await closeMilestone(milestone.number)
  }

  console.log(
    [
      'Only a few more things to do:',
      '  - publish the release notes',
      '  - merge the release branch into next and push the merge commit',
      '    - `git switch next`',
      `    - \`git merge ${releaseBranch}\``,
      `    - \`git push ${redwoodRemote}\``,
      '  - delete the release branch locally and on GitHub (https://github.com/redwoodjs/redwood/branches)',
      `    - \`git branch -d ${releaseBranch}\``,
      `    - \`git push ${redwoodRemote} --delete ${releaseBranch}\``,
      '  - Update the Algolia search index',
      '    - https://crawler.algolia.com',
      '    - "Restart crawling" (top right)',
      '  - post on Slack, Discord, and Buffer',
    ].join('\n')
  )
}

async function pushAndDiff() {
  exitIfNo(
    await question(
      `Ok to push ${chalk.magenta(
        releaseBranch
      )} to GitHub and open the diff? [Y/n] > `
    )
  )

  await $`git push -u ${redwoodRemote} ${releaseBranch}`
  await $`open ${compareURL}/${latestRelease}...${releaseBranch}`
}

async function exitIfNo(answer, { code } = { code: 1 }) {
  if (isYes(answer)) {
    return
  }

  process.exit(code)
}

/**
 * Iterates over `@redwoodjs/*` dependencies in a package.json and updates their version.
 *
 * @param {string} pkgPath
 * @param {string} version
 */
function updateRWJSPkgsVersion(pkgPath, version) {
  const pkg = fs.readJSONSync(path.join(pkgPath, 'package.json'), 'utf-8')

  for (const dep of Object.keys(pkg.dependencies ?? {}).filter(isRWJSPkg)) {
    console.log(` - ${dep}: ${pkg.dependencies[dep]} => ${version}`)
    pkg.dependencies[dep] = `${version}`
  }

  for (const dep of Object.keys(pkg.devDependencies ?? {}).filter(isRWJSPkg)) {
    console.log(` - ${dep}: ${pkg.devDependencies[dep]} => ${version}`)
    pkg.devDependencies[dep] = `${version}`
  }

  for (const dep of Object.keys(pkg.peerDependencies ?? {}).filter(isRWJSPkg)) {
    console.log(` - ${dep}: ${pkg.devDependencies[dep]} => ${version}`)
    pkg.devDependencies[dep] = `${version}`
  }

  fs.writeJSONSync(path.join(pkgPath, 'package.json'), pkg, { spaces: 2 })
}

const isRWJSPkg = (pkg) => pkg.startsWith('@redwoodjs/')
