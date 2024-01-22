/* eslint-env node */

import { fileURLToPath } from 'node:url'

import { faker } from '@faker-js/faker'
import boxen from 'boxen'
import { Octokit } from 'octokit'
import ora from 'ora'
import _prompts from 'prompts'
import semver from 'semver'
import { cd, chalk, fs, path, question, $ } from 'zx'

import 'dotenv/config'

// ─── Constants ───────────────────────────────────────────────────────────────

const triageDataRepoPath = new URL(`../../../triage-data/`, import.meta.url)

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   line: string,
 *   ref: string,
 *   type: 'commit' | 'ui' | 'release-chore' | 'tag'
 *   pretty: string,
 *   needsCherryPick?: boolean,
 * }} Commit
 *
 * @typedef {Map<string, { message: string, needsCherryPick: boolean }>} CommitTriageData
 *
 * @typedef {{ from: string, to: string }} Range
 */

// ─── IO ──────────────────────────────────────────────────────────────────────

// A string of dashes that spans the width of the user's terminal terminal.
export const separator = chalk.dim('-'.repeat(process.stdout.columns))

// Set the verbosity of all the functions in this file.
export function setVerbosity(verbose) {
  $.verbose = verbose
}

export function getLogger() {
  return $.verbose ? console.log : () => {}
}

/**
 *
 * @param {string} message
 */
export function getSpinner(message) {
  return $.verbose
    ? {
        stop: () => {},
      }
    : ora(message).start()
}

/**
 * Helper for getting the trimmed stdout from `zx`'s `ProcessOutput`:
 *
 * ```js
 * unwrap(await $`git branch --list release/*`)
 * ```
 *
 * @param {import('zx').ProcessOutput} processOutput
 */
export function unwrap(processOutput) {
  return processOutput.stdout.trim()
}

/**
 * @param {string} title
 * @param {string} message
 */
export function consoleBoxen(title, message) {
  console.log()
  console.log(
    boxen(message, {
      title,

      backgroundColor: '#333',
      borderStyle: 'round',

      float: 'left',

      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
    })
  )
}

/**
 * See if the user answered yes to `zx`'s `question`, which is just `readline`.
 *
 * ```
 * const okToRelease = isYes(await question('Ok to release?'))
 *
 * if (okToRelease) {
 *   // ...
 * }
 * ```
 *
 * @param {string} res
 */
export function isYes(res) {
  return ['', 'Y', 'y'].includes(res)
}

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
export function prompts(promptsObject, promptsOptions) {
  return _prompts(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

// ─── Branch Statuses ─────────────────────────────────────────────────────────

/**
 * Basically runs `git pull upstream` or `git fetch upstream` on branches with
 * safety checks and logging.
 *
 * @param {string[]} branches
 */
export async function resolveBranchStatuses(branches) {
  const spinner = getSpinner(
    `Resolving branch statuses for: ${branches
      .map((branch) => chalk.magenta(branch))
      .join(', ')}`
  )

  const logger = getLogger()

  logger(separator)
  logger(
    `Resolving statuses for: ${branches
      .map((branch) => chalk.magenta(branch))
      .join(', ')}`
  )

  let result

  // We need to run `git remote update ${redwoodRemote}` to `git fetch ${branch}`.
  // Nine out of ten times, the redwood remote is `upstream`. But let's just be sure.
  result = await getRedwoodRemote()

  if (result.error) {
    return result
  }

  logger(`Found Redwood remote ${chalk.magenta(result.redwoodRemote)}`)

  await $`git remote update ${result.redwoodRemote}`

  // Get an object of branches to their commit statuses. I.e., if they're ahead, behind, or diverged.
  const branchesToCommits = await getBranchesToCommits(branches, {
    redwoodRemote: result.redwoodRemote,
  })

  spinner.stop()

  result = await handleBranchesToCommits(branchesToCommits, {
    redwoodRemote: result.redwoodRemote,
  })

  return result
}

/**
 * Find the remote that points to `redwoodjs/redwood.git`.
 */
export async function getRedwoodRemote() {
  const result = {
    redwoodRemote: undefined,
    error: undefined,
  }

  const gitRemotes = unwrap(await $`git remote -v`).split('\n')

  result.redwoodRemote = gitRemotes.reduce((redwoodRemote, remote) => {
    if (redwoodRemote) {
      return redwoodRemote
    }

    const found = remote.match(
      /(?<name>\w+)\s+(git@|https:\/\/)github\.com(:|\/)redwoodjs\/redwood\.git/
    )

    if (found?.groups.name) {
      return found.groups.name
    }
  }, result.redwoodRemote)

  if (!result.redwoodRemote) {
    result.error =
      "Couldn't find a git remote that points to redwoodjs/redwood.git"
  }

  return result
}

/**
 * Build an object like...
 *
 * ```js
 * {
 *   main: {
 *     existsOnRedwoodRemote: true,
 *     upToDate: false,
 *     diverged: false,
 *     commitsExclusiveToLocalBranch: 0,
 *     commitsExclusiveToRemoteBranch: 4
 *   },
 *   next: ...
 * }
 * ```
 *
 * @param {string[]} branches
 */
export async function getBranchesToCommits(branches, { redwoodRemote }) {
  return branches.reduce(async (branchesToCommitsPromise, branch) => {
    const branchesToCommits = await branchesToCommitsPromise

    if (!(await branchExistsOnRedwoodRemote(branch, redwoodRemote))) {
      branchesToCommits[branch] = { existsOnRedwoodRemote: false }
    } else {
      const commitsExclusiveToLocalBranch = +unwrap(
        await $`git rev-list ${redwoodRemote}/${branch}..${branch} --count`
      )
      const commitsExclusiveToRemoteBranch = +unwrap(
        await $`git rev-list ${branch}..${redwoodRemote}/${branch} --count`
      )

      branchesToCommits[branch] = {
        existsOnRedwoodRemote: true,
        upToDate:
          commitsExclusiveToLocalBranch === 0 &&
          commitsExclusiveToRemoteBranch === 0,
        diverged:
          commitsExclusiveToLocalBranch > 0 &&
          commitsExclusiveToRemoteBranch > 0,
        commitsExclusiveToLocalBranch,
        commitsExclusiveToRemoteBranch,
      }
    }

    return branchesToCommits
  }, Promise.resolve({}))
}

/**
 * @param {string} branch
 */
export async function branchExistsOnRedwoodRemote(branch, redwoodRemote) {
  return !!unwrap(await $`git ls-remote --heads ${redwoodRemote} ${branch}`)
}

/**
 * Logs results. Returns an error if a branch diverged. Otherwise, prompts the user to update their local branches if they need to.
 */
export async function handleBranchesToCommits(
  branchesToCommits,
  { redwoodRemote }
) {
  const result = {
    error: undefined,
  }

  const message = Object.entries(branchesToCommits).map(([branch, status]) => {
    if (!status.existsOnRedwoodRemote) {
      return `❓ ${chalk.magenta(
        branch
      )} doesn't exist on the Redwood remote (${redwoodRemote})`
    }

    if (status.upToDate) {
      return `✅ ${chalk.magenta(branch)} is up to date`
    }

    return [
      `🧮 ${chalk.magenta(branch)} has...`,
      `   🏠 ${status.commitsExclusiveToLocalBranch} commit(s) locally that the remote branch doesn't`,
      `   📡 ${status.commitsExclusiveToRemoteBranch} commit(s) remotely that the local branch doesn't`,
    ].join('\n')
  })

  consoleBoxen('🐙 Branch status(es)', message.join('\n'))

  const divergedGetter = ([, { diverged }]) => diverged

  const diverged = Object.entries(branchesToCommits).some(divergedGetter)

  if (diverged) {
    const branches = Object.entries(branchesToCommits)
      .filter(divergedGetter)
      .map(([branch]) => chalk.magenta(branch))
      .join(', ')

    result.error = [
      `The following branch(es) have diverged—they have commits that are exclusive to both the local and remote: ${branches}.`,
      "Trying to triage commits right now probably isn't going to be a good time.",
    ].join('\n')
  } else {
    for (const [branch, status] of Object.entries(branchesToCommits)) {
      const pullOrFetch = branch === 'main' ? 'pull' : 'fetch'

      if (
        status.commitsExclusiveToRemoteBranch &&
        isYes(
          await question(
            `Ok to \`git ${pullOrFetch}\` ${chalk.magenta(branch)}? [Y/n] `
          )
        )
      ) {
        await $`git ${pullOrFetch} ${redwoodRemote} ${branch}:${branch}`
      }
    }
  }

  return result
}

// ─── Git ─────────────────────────────────────────────────────────────────────

/**
 * @param {string} range
 */
export async function triageRange(range) {
  const spinner = getSpinner(
    `Getting the symmetric difference between ${chalk.magenta(
      range.from
    )} and ${chalk.magenta(range.to)}`
  )

  // Sometimes one of the `range` branches is a release branch with slashes like `release/branch/v6.3.3`.
  // Here we're just replacing the slashes with dashes so that it's a valid file name.
  const fileNamePrefix = [
    range.from.replaceAll('/', '-'),
    range.to.replaceAll('/', '-'),
  ].join('_')

  // Commit triage data files (like `main_next.commitTriageData.json`) come in and out of existence,
  // so we can't rely on them to know if the triage data repo was cloned. Instead we use `.git`.
  if (!fs.existsSync(new URL('./.git', triageDataRepoPath))) {
    spinner.stop()
    throw new Error(
      [
        "You're missing commit triage data.",
        'You need to clone the triage data repo (https://github.com/redwoodjs/triage-data)',
        'adjacent to the redwood one:',
        '',
        '```',
        '.',
        '├── redwood',
        '└── triage-data',
        '```',
      ].join('\n')
    )
  }

  // Set up the commit triage data. This reads a file like `./main_next.commitTriageData.json` into a map
  // and sets up a hook on `process.exit` so that we don't have to remember to write it.
  //
  // The commit triage data is a map of commit hashes to triage data:
  //
  // ```js
  // 'adddd23987b8a1003053280fafe772275e932217' => {
  //   message: 'chore(deps): update dependency lerna to v7.3.0 (#9186)',
  //   needsCherryPick: false
  // }
  // ```
  let commitTriageData
  const commitTriageDataPath = new URL(
    `./${fileNamePrefix}.commitTriageData.json`,
    triageDataRepoPath
  )

  try {
    commitTriageData = new Map(
      Object.entries(fs.readJSONSync(commitTriageDataPath, 'utf-8'))
    )
  } catch (e) {
    if (e.code === 'ENOENT') {
      commitTriageData = new Map()
    } else {
      throw e
    }
  }

  // In git, the "symmetric difference" (syntactically, three dots: `...`) is what's different between two branches.
  // It's the commits one branch has that the other doesn't, and vice versa:
  //
  // ```
  // git log main...next
  // ```
  //
  // Here we're only interested in the commits `range.from` (e.g., `main`) has that `range.to` (e.g. `next`) doesn't
  // because we're cherry picking from the former to the latter.
  //
  // `git log` by itself isn't quite enough, but there are a couple flags that get us closer to what we want:
  //
  // - `--left-only` shows us the commits unique to the ref on the left side of the three dots
  // - `--cherry-pick` omits commits that are _exactly_ the same between the branches
  //
  // It's very likely that some of the commits that are unique to the left ref have already been cherry picked into the right one.
  // The reason that the `--cherry-pick` flag doesn't omit them  is that they were changed while cherry picking
  // (think updating `yarn.lock`, etc.) so the diffs aren't one-to-one. The commit triage data and `git log --grep` get us the rest of the way there.
  const lines = await getSymmetricDifference(range)

  // Save the result for QA. (See `./triage/triageQA.mjs`.)
  await fs.writeJSON(
    new URL(
      `./triage/${fileNamePrefix}.symmetricDifference.json`,
      import.meta.url
    ),
    lines,
    {
      spaces: 2,
    }
  )

  spinner.text = 'Resolving the symmetric difference'
  const commits = await resolveSymmetricDifference(lines, {
    range,
  })
  spinner.stop()

  const commitsToTriage = await resolveCommitsToTriage({
    commits,
    commitTriageData,
    range,
  })

  if (commitsToTriage.length) {
    // Reversing here so that we triage commits from oldest newest. It's more natural to triage this way
    // because otherwise you'll be missing context for the newer commits.
    await triageCommits({
      commits: commitsToTriage.reverse(),
      commitTriageData,
      range,
    })
    console.log()
  }

  reportCommitStatuses({ commits, commitTriageData, range })

  if (commitTriageData.size || prMilestoneCache.size) {
    fs.writeJSONSync(
      commitTriageDataPath,
      Object.fromEntries(commitTriageData),
      {
        spaces: 2,
      }
    )
    fs.writeJSONSync(
      prMilestoneCachePath,
      Object.fromEntries(prMilestoneCache),
      {
        spaces: 2,
      }
    )

    await cd(fileURLToPath(triageDataRepoPath))
    await $`git commit -am "triage ${new Date().toISOString()}"`
    await $`git push`
  }
}

export const defaultGitLogOptions = [
  '--oneline',
  '--no-abbrev-commit',
  '--left-right',
  '--graph',
  '--left-only',
  '--cherry-pick',
  '--boundary',
]

/**
 * Get the symmetric difference between two refs. (Basically, what's different about them.)
 * This is used to compare:
 * - main to next
 * - next to the release branch
 *
 * It doesn't really matter which ref is left and which is right.
 * The commits in the left ref will be prefixed with "<", while the commits in the right ref will be prefixed with ">".
 *
 * For a quick reference on the `...` syntax,
 * see https://stackoverflow.com/questions/462974/what-are-the-differences-between-double-dot-and-triple-dot-in-git-com.
 *
 * @param {string} leftRef
 * @param {string} rightRef
 */
export async function getSymmetricDifference(
  range,
  { gitLogOptions = undefined } = {}
) {
  return unwrap(
    await $`git log ${gitLogOptions ?? defaultGitLogOptions} ${range.from}...${
      range.to
    }`
  ).split('\n')
}

/**
 * Resolves the return of `getSymmetricDifference`. `getSymmetricDifference` gets us the commits that are different between two refs,
 * but some of those commits are...
 *
 * - decorative (some lines are just UI when `--graph` is passed)
 * - virtually the same (only the `yarn.lock` has changed)
 * - aren't meant to be cherry picked
 * - etc.
 *
 * @param {string[]} lines
 * @param {{
 *   range: { from: string, to: string },
 *   refsToColors?: Record<string, () => string>
 * }} options
 *
 * @return {Commit[]}
 */
export async function resolveSymmetricDifference(
  lines,
  { range, refsToColorFunctions = {} }
) {
  const logger = getLogger()

  // We make a copy and reverse so that the refs are in ascending order (v6.3.0, v6.3.1, v6.3.2, etc)
  // so that we can break out of a loop later on earlier than otherwise.
  const refs = Array.isArray(range.to) ? [...range.to] : [range.to]
  refs.reverse()

  // Set defaults.
  for (const ref of refs) {
    refsToColorFunctions[ref] ??= chalk.dim.bgBlue
  }

  const commits = await Promise.all(
    lines.map((line) =>
      resolveLine(line, {
        range: { ...range, to: refs },
        refsToColorFunctions,
        logger,
      })
    )
  )

  return commits
}

export async function resolveLine(
  line,
  { range, refsToColorFunctions, logger }
) {
  const logs = []

  const commit = {
    line,
    type: 'commit',
    ref: range.from,
    pretty: line,
  }

  // This functions modifies the commit object above.
  await resolveCommitType(commit, { logs })

  if (['ui', 'tag', 'release-chore'].includes(commit.type)) {
    return commit
  }

  // We check refs in order from least recent to most and break once we find one.
  for (const ref of range.to) {
    logs.push(
      ['', `🔎 checking if commit is in ${chalk.magenta(ref)}`].join('\n')
    )

    const isInRef = unwrap(
      await $`git log ${ref} --oneline --grep ${sanitizeMessage(
        commit.message
      )}`
    )

    if (isInRef) {
      logs.push(`✅ commit is in ${chalk.magenta(ref)}`)

      commit.ref = ref
      commit.pretty = refsToColorFunctions[ref](commit.pretty)

      break
    }

    logs.push(`❌ commit isn't in ${chalk.magenta(ref)}`)
  }

  logger(
    [...logs, '', commit.pretty, JSON.stringify({ commit }, null, 2)].join('\n')
  )

  return commit
}

async function resolveCommitType(commit, { logs }) {
  logs.push(separator)

  if (isLineGitLogUI(commit.line)) {
    commit.type = 'ui'
    commit.pretty = chalk.dim(commit.line)

    logs.push('🎄 this line is just `git log` ui')

    return
  }

  // Every commit has a hash so we're not bothering with optional chaining here.
  commit.hash = commit.line.match(commitRegExps.hash).groups.hash

  // TODO: explain this.
  commit.message = unwrap(await $`git log --format=%s -n 1 ${commit.hash}`)

  if (commitRegExps.annotatedTag.test(commit.message)) {
    commit.type = 'tag'
    commit.ref = commit.message
    commit.pretty = chalk.dim(commit.line)

    logs.push('🔖 this commit is an annotated tag')

    return
  }

  if (isCommitReleaseChore(commit.line)) {
    commit.type = 'release-chore'
    commit.pretty = chalk.dim(commit.line)

    logs.push('🧹 this commit is a release chore')

    return
  }

  if (commit.message.startsWith('Revert')) {
    commit.type = 'revert'
    commit.pretty = chalk.underline(commit.line)

    logs.push('↩️ this commit reverts a previous commit')

    return
  }

  // Not all commits are associated with a PR.
  commit.pr = commit.message.match(commitRegExps.pr)?.groups.pr

  if (!commit.pr) {
    return
  }

  commit.url = `https://github.com/redwoodjs/redwood/pull/${commit.pr}`

  // If we can't get a commit that has a PR's milestone, it's a bug.
  try {
    commit.milestone = await getPRMilestoneFromURL(commit.url)
  } catch (e) {
    throw new Error(
      [
        `Error: Couldn't get milestone for ${commit.line} using ${commit.url}`,
        '',
        e,
      ].join('\n')
    )
  }

  commit.line = `${commit.line} (${commit.milestone})`
  commit.pretty = commit.line

  logs.push('🔖 this commit is a pr with a milestone')
}

/**
 * Find out if a line from `git log --graph` is just UI:
 *
 * ```
 * * 1b0b9a9 | chore: update dependencies
 * |\  # This is just UI
 * | * 3a4b5c6 (HEAD -> release/3.6, origin/release/3.6) chore: update dependencies
 * ```
 *
 * @param {string} line
 */
function isLineGitLogUI(line) {
  // TODO: test this fn for sure. can't i cross check against the git docs?
  const marks = ['o', ' /', '|\\', '| o', '|\\|', '|/']
  return marks.some((mark) => line.startsWith(mark))
}

const commitRegExps = {
  hash: /\s(?<hash>\w{40})\s/,
  pr: /\(#(?<pr>\d+)\)$/,
  annotatedTag: /^v\d.\d.\d$/,
}

/**
 * See if a commit is a release chore via it's message. Note that these are different than PRs with the chore milestone.
 *
 * @param {string} line
 */
function isCommitReleaseChore(line) {
  const choreMessages = [
    'chore: update yarn.lock',
    'Version docs',
    'chore: update all contributors',
  ]

  return (
    /Merge branch (?<branch>.*)/.test(line) ||
    choreMessages.some((message) => line.includes(message))
  )
}

/**
 * Square brackets (`[` or `]`) in commit messages need to be escaped.
 *
 * @param {string} message
 */
function sanitizeMessage(message) {
  return message.replace('[', '\\[').replace(']', '\\]')
}

/**
 * @param {{
 *   commits: Commit[]
 *   commitTriageData: CommitTriageData,
 *   targetBranch: string,
 * }} options
 */
export async function resolveCommitsToTriage({
  commits,
  commitTriageData,
  range,
}) {
  const logs = []

  const commitHashes = commits.map((commit) => commit.hash)

  // `commits` are commits from main (or another branch) that are candidates for cherry picking.
  // If the hash of one of them isn't in the commit triage data, it was cherry picked cleanly,
  // so we don't need to keep track of it anymore.
  for (const [hash] of commitTriageData) {
    if (!commitHashes.includes(hash)) {
      logs.push(
        `✨ ${chalk.cyan(
          commitTriageData.get(hash).message
        )} was cherry picked cleanly`
      )
      commitTriageData.delete(hash)
    }
  }

  // Delete those that needed to be cherry picked and have been. These ones weren't clean cherry picks.
  const needsCherryPick = new Map(
    [...commitTriageData.entries()].filter(
      ([_hash, triageData]) => triageData.needsCherryPick
    )
  )

  for (const [hash, triageData] of needsCherryPick) {
    const { ref } = commits.find((commit) => commit.hash === hash)

    if (ref === range.to) {
      logs.push(
        `🐙 ${chalk.cyan(triageData.message)} was cherry picked with changes`
      )
      commitTriageData.delete(hash)
    }
  }

  if (logs.length) {
    consoleBoxen(
      '🧹 Purging commit triage data',
      [`Removed ${logs.length} commits:`, ...logs].join('\n')
    )
  } else {
    consoleBoxen('✅', 'The commit triage data is up to date')
  }

  // Get the commits that need triage. The logic for the filters is:
  //
  // - not every annotated commit is a commit; some are just `git log --graph` ui, so filter those out
  // - at this point, annotated commits that have a `ref` that's the same as the target branch have already been cherry picked
  // - now that the commit triage data is up to date, any annotated commits that aren't in it haven't been triaged
  return commits
    .filter((commit) => commit.type === 'commit')
    .filter((commit) => commit.ref !== range.to)
    .filter((commit) => !commitTriageData.has(commit.hash))
}

/**
 * Given an array of commit objects, ask if they need to be cherry picked and update the commit triage data in response.
 *
 * @param {{
 *   commitsToTriage: AnnotatedCommit[],
 *   commitTriageData: CommitTriageData,
 *   range: Range,
 * }} options
 */
export async function triageCommits({ commits, commitTriageData, range }) {
  consoleBoxen(
    `🐙 New commit(s)`,
    [
      [
        `There is/are ${chalk.magenta(commits.length)} commit(s)`,
        `in the ${chalk.magenta(range.from)} branch`,
        `that isn't/aren't in the ${chalk.magenta(range.to)} branch:`,
      ].join(' '),
      ...commits.map(({ hash, message }) => `• ${chalk.dim(hash)} ${message}`),
    ].join('\n')
  )

  for (const commit of commits) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const message = [
        'Does...',
        [
          '  •',
          chalk.dim(commit.hash),
          chalk.cyan(commit.message),
          commit.milestone && chalk.yellow(`(${commit.milestone})`),
        ]
          .filter(Boolean)
          .join(' '),
        `need to be cherry picked into ${chalk.magenta(
          range.to
        )}? [Y/n/s(kip)/o(pen)] > `,
      ]
        .filter(Boolean)
        .join('\n')

      let answer = 'no'
      if (!['RSC', 'v7.0.0'].includes(commit.milestone)) {
        answer = await question(message)
      }

      answer = getLongAnswer(answer)

      let comment = ''
      if (answer === 'skip') {
        const commentRes = await prompts({
          type: 'text',
          name: 'comment',
          message: 'Why are you skipping it?',

          validate: (comment) => comment.length > 0 || 'Please enter a comment',
        })

        comment = commentRes.comment
      }

      if (answer === 'open') {
        if (commit.url) {
          await $`open ${commit.url}`
        } else {
          console.log("There's no PR for this commit")
        }

        continue
      }

      commitTriageData.set(commit.hash, {
        message: commit.message,
        needsCherryPick: answer,
        ...(comment && { comment }),
      })

      break
    }
  }
}

/**
 *
 * @param {string} answer
 * @returns {'yes'|'no'|'skip'|'open'}
 */
function getLongAnswer(answer) {
  answer = answer.toLowerCase()

  if (['', 'y', 'yes'].includes(answer)) {
    return 'yes'
  }

  if (['n', 'no'].includes(answer)) {
    return 'no'
  }

  if (['s', 'skip'].includes(answer)) {
    return 'skip'
  }

  if (['o', 'open'].includes(answer)) {
    return 'open'
  }
}

export let prMilestoneCache
const prMilestoneCachePath = new URL(
  './prMilestoneCache.json',
  triageDataRepoPath
)

/**
 * @param {string} prURL
 */
export async function getPRMilestoneFromURL(prURL) {
  if (!prMilestoneCache) {
    try {
      prMilestoneCache = new Map(
        Object.entries(fs.readJSONSync(prMilestoneCachePath, 'utf-8'))
      )
    } catch (e) {
      if (e.code === 'ENOENT') {
        prMilestoneCache = new Map()
      } else {
        throw e
      }
    }
  }

  if (prMilestoneCache.has(prURL)) {
    return prMilestoneCache.get(prURL)
  }

  const octokit = await getOctokit()

  const {
    resource: {
      milestone: { title },
    },
  } = await octokit.graphql(getPRMilestoneFromURLQuery, { prURL })

  prMilestoneCache.set(prURL, title)

  return title
}

const getPRMilestoneFromURLQuery = `
  query GetMilestoneForCommitQuery($prURL: URI!) {
    resource(url: $prURL) {
      ...on PullRequest {
        milestone {
          title
        }
      }
    }
  }
`

/**
 * @param {{
 *   commit: Commit[],
 *   commitTriageData: CommitTriageData
 *   range: { from: string, to: string },
 * }} param0
 */
export function reportCommitStatuses({ commits, commitTriageData, range }) {
  // We still have to color commits based on their cherry pick status.
  // First, get the ones to color:
  const commitsToColor = commits
    .filter((commit) => commit.type === 'commit')
    .filter((commit) => commit.ref !== range.to)

  // If everything was called in order, this shouldn't happen.
  const needsTriage = commitsToColor.filter(
    (commit) => !commitTriageData.has(commit.hash)
  )

  if (needsTriage.length) {
    consoleBoxen(
      '👷 Heads up',
      [
        "At this point, there shouldn't been any commits that haven't been triaged",
        "but it looks like there's a few:",
        '',
        ...needsTriage.map((commit) => chalk.bgYellowBright(commit.line)),
      ].join('\n')
    )
  }

  for (const commit of commitsToColor) {
    const { needsCherryPick, comment } = commitTriageData.get(commit.hash)

    if (needsCherryPick === 'yes') {
      commit.pretty = chalk.green(commit.line)
    } else if (needsCherryPick === 'no') {
      commit.pretty = chalk.red(commit.line)
    } else {
      commit.pretty = [chalk.yellow(commit.line), `  ${comment}`].join('\n')
    }

    commit.needsCherryPick = needsCherryPick
  }

  consoleBoxen(
    '🔑 Key',
    [
      `${chalk.green('■')} Needs to be cherry picked into ${chalk.magenta(
        range.to
      )}`,
      `${chalk.yellow('■')} Skipped (see comments for details)`,
      $.verbose &&
        `${chalk.blue('■')} Was cherry picked into ${chalk.magenta(
          range.to
        )} with changes`,
      $.verbose &&
        `${chalk.dim.red('■')} Shouldn't be cherry picked into ${chalk.magenta(
          range.to
        )}`,
      $.verbose && `${chalk.dim('■')} Chore commit or purely-decorative line`,
    ]
      .filter(Boolean)
      .join('\n')
  )
  console.log()
  console.log(
    commits
      .filter(
        (commit) =>
          $.verbose || ['yes', 'skip'].includes(commit.needsCherryPick)
      )
      .map(({ pretty }) => pretty)
      .join('\n')
  )
}

/**
 *
 * @param {{ from: string, to: string[] }} range
 * @param {{ colorSeed: number }} options
 */
export async function compareRange(range, { colorSeed = 0 } = {}) {
  const spinner = getSpinner(
    `Getting the symmetric difference between ${chalk.magenta(
      range.from
    )} and ${chalk.magenta(range.to[0])}`
  )

  const lines = await getSymmetricDifference({
    ...range,
    to: range.to[0],
  })

  // Save the result for QA. (See `./compare/compareQA.mjs`.)
  // Sometimes one of the `range` branches is a release branch with slashes like `release/branch/v6.3.3`.
  // Here we're just replacing the slashes with dashes so that it's a valid file name.
  const fileNamePrefix = [
    range.from.replaceAll('/', '-'),
    range.to[0].replaceAll('/', '-'),
  ].join('_')

  await fs.writeJSON(
    new URL(
      `./compare/${fileNamePrefix}.symmetricDifference.json`,
      import.meta.url
    ),
    lines,
    {
      spaces: 2,
    }
  )

  faker.seed(colorSeed)

  const refsToColors = range.to.reduce((colors, ref) => {
    colors[ref] = faker.color.rgb()
    return colors
  }, {})

  spinner.text = 'Resolving the symmetric difference (this could take a while)'
  const commits = await resolveSymmetricDifference(lines, {
    range,
    refsToColorFunctions: Object.entries(refsToColors).reduce(
      (refsToColorFunctions, [ref, color]) => {
        refsToColorFunctions[ref] = chalk.bgHex(color)
        return refsToColorFunctions
      },
      {}
    ),
  })
  spinner.stop()

  const milestonesToCommits = commits.reduce((milestonesToCommits, commit) => {
    if (!commit.milestone) {
      return milestonesToCommits
    }

    milestonesToCommits[commit.milestone] =
      (milestonesToCommits[commit.milestone] ?? 0) + 1
    return milestonesToCommits
  }, {})

  consoleBoxen(
    '🔖 Milestones to commits',
    Object.entries(milestonesToCommits)
      .map(([milestone, commits]) => `${milestone} (${commits})`)
      .sort()
      .join('\n')
  )

  // Make an object of refs to the number of commits with that ref to show in the key:
  //
  // ```js
  // {
  //   next: 23,
  //   'v6.3.2': 4,
  //   ...
  // }
  // ```
  const refsToCommits = commits.reduce((refsToCommits, commit) => {
    refsToCommits[commit.ref] = (refsToCommits[commit.ref] ?? 0) + 1
    return refsToCommits
  }, {})

  // Sometimes we check quite a few versions to figure out where a commit was released for the first time.
  const refsToColorsKey = Object.entries(refsToColors)
    .filter(([ref]) =>
      commits
        // TODO: it may be worth making this filter a little smarter.
        .filter((commit) => commit.type === 'commit')
        .some((commit) => commit.ref === ref)
    )
    .map(([ref, color]) => {
      return `${chalk.hex(color)('■')} ${ref} (${refsToCommits[ref]})`
    })

  consoleBoxen(
    '🔑 Key',
    [
      `${chalk.white('■')} ${range.from} ${`(${refsToCommits[range.from]})`}`,
      ...refsToColorsKey,
      `${chalk.dim('■')} Chore commit or purely-decorative line`,
    ].join('\n')
  )
  console.log([...commits.map((commit) => commit.pretty)].join('\n'))
}

/**
 * Gets the latest release. Uses the "-" prefix of `git tag`'s `--sort` option. See https://git-scm.com/docs/git-tag#Documentation/git-tag.txt---sortltkeygt
 */
export async function getLatestRelease() {
  return unwrap(
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`
  )
}

/**
 * Gets releases branches (e.g. `release/major/v7.0.0`, `release/minor/v6.4.0`, `release/patch/v6.3.2`, etc.)
 */
export async function getReleaseBranches() {
  let releaseBranches = unwrap(await $`git branch --list release/*`)

  if (releaseBranches === '') {
    return []
  }

  releaseBranches = releaseBranches
    .split('\n')
    .map((branch) => branch.trim())
    .sort((releaseBranchA, releaseBranchB) => {
      const [, , versionA] = releaseBranchA.split('/')
      const [, , versionB] = releaseBranchB.split('/')

      return semver.compare(versionA, versionB)
    })

  return releaseBranches.reverse()
}

/**
 * @param {string} branch
 */
export async function branchExists(branch) {
  return !!unwrap(await $`git branch --list ${branch}`)
}

// ─── Github ──────────────────────────────────────────────────────────────────

let octokit

export async function getOctokit() {
  if (octokit) {
    return octokit
  }

  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error(
      [
        `You have to set the ${chalk.magenta(
          'GITHUB_TOKEN'
        )} env var to a personal access token.`,
        `Create a personal access token with the ${chalk.magenta(
          'repo'
        )} scope here: https://github.com/settings/tokens.`,
      ].join('\n')
    )
  }

  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  try {
    await octokit.graphql(`{ viewer { login } }`)
  } catch (e) {
    if (e.status === 401) {
      throw new Error(
        `The ${chalk.magenta(
          'GITHUB_TOKEN'
        )} env var is set, but using it in a test query returned a 401. It may have expired`
      )
    }

    throw e
  }

  return octokit
}

/**
 * @param {string} title
 */
export async function getMilestones() {
  const octokit = await getOctokit()

  const {
    repository: {
      milestones: { nodes },
    },
  } = await octokit.graphql(`
      {
        repository(owner: "redwoodjs", name: "redwood") {
          milestones(first: 100, states: OPEN) {
            nodes {
              title
              id
              number
            }
          }
        }
      }
    `)

  return nodes
}

// TODO: this needs to be recursive.
/**
 * @param {string} milestoneTitle
 */
export async function getPRsWithMilestone(milestoneTitle) {
  const milestone = (await getMilestones()).find(
    (milestone) => milestone.title === milestoneTitle
  )

  const octokit = await getOctokit()

  const {
    node: {
      pullRequests: { nodes },
    },
  } = /** @type {GetPullRequestIdsRes} */ (
    await octokit.graphql(
      `
        query ($milestoneId: ID!) {
          node(id: $milestoneId) {
            ... on Milestone {
              pullRequests(first: 100, states: MERGED) {
                nodes {
                  id
                  mergedAt

                  labels(first: 10) {
                    nodes {
                      name
                    }
                  }

                  title
                  number
                  author {
                    login
                  }

                  body
                }
              }
            }
          }
        }
      `,
      {
        milestoneId: milestone.id,
      }
    )
  )

  return nodes
}

export async function openCherryPickPRs() {
  await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Aopen+label%3Acherry-pick`
}

// ─── Misc ────────────────────────────────────────────────────────────────────

/**
 * Find a file by walking up parent directories.
 *
 * @param {string} file
 * @param {string} [startingDirectory=process.cwd()]
 * @returns {string | null}
 */
export function findUp(file, startingDirectory = process.cwd()) {
  const possibleFilepath = path.join(startingDirectory, file)

  if (fs.existsSync(possibleFilepath)) {
    return possibleFilepath
  }

  const parentDirectory = path.dirname(startingDirectory)

  // If we've reached the root directory, there's no file to be found.
  if (parentDirectory === startingDirectory) {
    return null
  }

  return findUp(file, parentDirectory)
}
