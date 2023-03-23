/* eslint-env node */

import { fileURLToPath } from 'node:url'

import { faker } from '@faker-js/faker'
import boxen from 'boxen'
import prompts_ from 'prompts'
import { $, fs, question, chalk } from 'zx'

/**
 * Helper for getting the trimmed stdout from `$`'s awaited return.
 *
 * @example
 *
 * The awaited part is important: you have to await `$`'s return:
 *
 * ```js
 * unwrap(await $`git branch --list release/*`)
 * ```
 *
 * @param {import('zx').ProcessOutput} processOutput
 */
function unwrap(processOutput) {
  return processOutput.stdout.trim()
}

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
export function prompts(promptsObject, promptsOptions) {
  return prompts_(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

/**
 * The triage-main and -next commands read from and write to a data file.
 * This sets it up so that we don't have to remember to write the file.
 *
 * @param {string} path
 */
export function setupData(path) {
  let data

  try {
    data = new Map(Object.entries(fs.readJSONSync(path, 'utf-8')))
  } catch (e) {
    if (e.code === 'ENOENT') {
      fs.ensureFileSync(path)
      data = new Map()
    } else {
      throw e
    }
  }

  process.on('exit', () => {
    fs.writeJSONSync(path, Object.fromEntries(data), { spaces: 2 })
  })

  return data
}

/**
 * Parse a commit "line" from `git log` into a commit object
 * (it's hash, message, and pr number if it has one).
 *
 * @param {string} commit
 * @returns {{ hash: string, message: string, pr: string }}
 */
export function parseCommit(commit) {
  const match = commit.match(/\w{9}/)
  const [hash] = match

  const message = commit.slice(match.index + 10)

  const prMatch = message.match(PR)
  const pr = prMatch?.groups.pr

  return {
    hash,
    message,
    pr,
  }
}

/**
 * Uses a commit's message to determine if a commit is in a given ref.
 *
 * ```js
 * await isCommitInRef('main', 'fix(setup-auth): notes formatting')
 * true
 *
 * await isCommitInRef('next', 'fix(setup-auth): notes formatting')
 * true
 *
 * await isCommitInRef('v3.5.0', 'fix(setup-auth): notes formatting')
 * false
 * ```
 *
 * This depends on the commit's message being left alone when cherry picking.
 *
 * @param {string} ref
 * @param {string} message
 */
export async function isCommitInRef(ref, message) {
  return !!unwrap(await $`git log ${ref} --oneline --grep ${message}`)
}

/**
 * @param {Array<any>} commits
 * @param {{ from: string, to: string }} branchData
 */
export function reportNewCommits(commits, { from, to }) {
  consoleBoxen(
    `🐙 New commits`,
    [
      `There's ${chalk.magenta(commits.length)} commits in the ${chalk.magenta(
        from
      )} branch that aren't in the ${chalk.magenta(to)} branch:`,
      ...commits.map(({ hash, message }) => `• ${chalk.dim(hash)} ${message}`),
    ].join('\n')
  )
}

/**
 * Given an array of commits, ask if they need to be cherry picked, etc.
 *
 * @param {Array<{ hash: string, message: string, pr: string }>} commits
 */
export async function triageCommits(commits, { data, branch }) {
  for (let commit of commits) {
    const { hash, message, pr } = commit

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const answer = await question(
        `Does ${chalk.dim(hash)} ${chalk.cyan(
          message
        )} need to be cherry picked into ${chalk.magenta(
          branch
        )}? [Y/n/o(pen)] > `
      )

      if (['open', 'o'].includes(answer)) {
        if (pr) {
          await $`open https://github.com/redwoodjs/redwood/pull/${pr}`
        } else {
          console.log("There's no PR for this commit")
        }

        continue
      }

      data.set(hash, {
        message: message,
        needsCherryPick: isYes(answer),
      })

      break
    }
  }
}

/**
 * Gets the release branch, if it exists.
 *
 * @example
 *
 * ```js
 * await getReleaseBranch()
 * // 'release/minor/v3.6.0'
 * ```
 */
export async function getReleaseBranch() {
  return unwrap(await $`git branch --list release/*`)
}

export async function purgeCommitData(data, { commits, branch }) {
  const logs = []

  const commitHashes = commits.map((commit) => commit.hash)

  for (const dataHash of data.keys()) {
    if (!commitHashes.includes(dataHash)) {
      logs.push(
        `• "${data.get(dataHash).message}" isn't in the symmetric difference`
      )
      data.delete(dataHash)
    }
  }

  const needsCherryPick = [...data.entries()].filter(
    ([, { needsCherryPick }]) => needsCherryPick
  )

  for (const [hash] of needsCherryPick) {
    const { ref } = commits.find((commit) => commit.hash === hash)

    if (ref === branch) {
      logs.push(
        `• "${data.get(hash).message}" was cherry picked into ${branch}`
      )
      data.delete(hash)
    }
  }

  if (logs.length) {
    consoleBoxen(
      '🧹 Purging commit data',
      [`Removed ${logs.length} commits:`, ...logs].join('\n')
    )
  } else {
    consoleBoxen('✅', 'No commit data to purge')
  }
}

/**
 * Usually used with `isCommitInRef`:
 *
 * ```js
 * await isCommitInRef('main', sanitizeMessage('fix(setup-auth): notes formatting [skip ci]'))
 * ```
 *
 * @param {string} message
 */
export function sanitizeMessage(message) {
  message = message.replace('[', '\\[')
  message = message.replace(']', '\\]')
  return message
}

/**
 * Updates remotes
 */
export async function updateRemotes() {
  await $`git remote update`

  const refsToCommits = await ['main', 'next'].reduce(async (P, ref) => {
    const refsToCommits = await P

    const noOfOriginCommits = await getNoOfOriginCommits(ref)

    refsToCommits[ref] = noOfOriginCommits

    if (noOfOriginCommits) {
      await $`git fetch origin ${ref}:${ref}`
    }

    return refsToCommits
  }, Promise.resolve({}))

  const messages = Object.entries(refsToCommits).map(([ref, commits]) => {
    return `• ${chalk.yellow(commits)} commit(s) from ${chalk.magenta(ref)}`
  })

  const hasCommits = Object.entries(refsToCommits).some(
    ([, commits]) => commits
  )

  console.log()
  consoleBoxen(
    hasCommits ? '🐙 Updated local refs' : "✅ You're up to date",
    ['Fetched...', ...messages].join('\n')
  )
}

/**
 * Find out if the a local branch has commits on the remote.
 *
 * ```js
 * await originHasCommits('main')
 * true
 * ```
 *
 * @param {string} ref
 */
async function getNoOfOriginCommits(ref) {
  return +unwrap(await $`git rev-list ${ref}...origin/${ref} --count`)
}

/**
 * @param {string} title
 * @param {string} message
 */
export function consoleBoxen(title, message) {
  console.log(boxen(message, { title, ...boxenStyles }))
}

const boxenStyles = {
  backgroundColor: '#333',
  borderStyle: 'round',
  float: 'left',
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  padding: { top: 0, right: 1, bottom: 0, left: 1 },
}

export async function getReleaseCommits({ useCache } = { useCache: true }) {
  const cachePath = fileURLToPath(
    new URL('data/releaseCommits.json', import.meta.url)
  )

  const cacheExists = fs.existsSync(cachePath)

  if (useCache && cacheExists) {
    return fs.readJSONSync(cachePath)
  }

  // ------------------------
  logSection('Getting the release branch and the last release\n')
  const releaseBranch = await getReleaseBranch()
  const latestRelease = await getLatestRelease()

  logSection(
    `Getting the symmetric difference between ${releaseBranch} and ${latestRelease}\n`
  )

  const stdout = await getSymmetricDifference(releaseBranch, latestRelease, {
    options: [
      ...defaultGitLogOptions,
      // See https://stackoverflow.com/questions/11459040/is-there-a-way-to-check-if-two-different-git-commits-are-equal-in-content
      '--cherry-mark',
    ],
  })

  // ------------------------
  logSection(
    `Checking if any of the commits in ${releaseBranch} were in a minor or patch release\n`
  )

  const [vMajor, minor] = releaseBranch.split('/').pop().split('.')

  faker.seed(+minor)

  let patches = (await $`git tag -l ${vMajor}.${minor - 2}.[!0]`).stdout.trim()
  console.log()

  patches &&= patches.split('\n')

  // If minor - 2  is less than 0, that means we just released a major.
  const tags = [minor - 2 < 0 && `${vMajor}.0.0`, ...patches, latestRelease]
    .reverse()
    .filter(Boolean)

  const tagsToColors = tags.reduce((colors, tag) => {
    colors[tag] = faker.color.rgb()
    return colors
  }, {})

  const commits = await annotateSymmetricDifference(
    stdout,
    {
      from: releaseBranch,
      to: tags,
    },
    {
      refsToColors: tagsToColors,
    }
  )

  const releaseCommits = commits.filter((commit) => {
    return commit.ref === releaseBranch && commit.type === 'commit'
  })

  const data = {
    commits,
    tagsToColors,
    releaseCommits,
    noReleaseCommits: releaseCommits.length,
  }
  fs.writeJSONSync(cachePath, data, { spaces: 2 })
  return data
}

export const defaultGitLogOptions = [
  '--oneline',
  '--no-abbrev-commit',
  '--left-right',
  '--graph',
]

/**
 * Logs a section to the terminal. This's purely ornamental,
 * it's just to facilitate parsing visual output.
 *
 * @example
 *
 * If you want to add a new line, add it at the end of the string:
 *
 * logSection('Getting the release branch and the last release\n')
 * ```bash
 * # --------------------
 * # Get the release branch and the last release
 *
 * $ git remote update
 * Fetching origin
 * ```
 *
 * @param {string} title
 */
export function logSection(title) {
  console.log([separator, chalk.dim(`# ${title}`)].join('\n'))
}

export const separator = chalk.dim('-'.repeat(process.stdout.columns))

/**
 * Gets the latest release.
 *
 * Uses the "-" prefix of `git tag`'s `--sort` option.
 * See https://git-scm.com/docs/git-tag#Documentation/git-tag.txt---sortltkeygt
 *
 * @example
 *
 * ```js
 * await getLatestRelease()
 * /'v3.5.0'
 * ```
 *
 */
export async function getLatestRelease() {
  return unwrap(
    await $`git tag --sort="-version:refname" --list "v?.?.?" | head -n 1`
  )
}

/**
 * Get the symmetric difference between two refs. (Basically, what's different about them.)
 *
 * Here this's used to compare:
 * - main to next
 * - next to the release branch
 *
 * It doesn't really matter which ref is left and which is right.
 * The commits in the left ref will be prefixed with "<",
 * while the commits in the right ref will be prefixed with ">".
 *
 * For a quick reference on the `...` syntax,
 * see https://stackoverflow.com/questions/462974/what-are-the-differences-between-double-dot-and-triple-dot-in-git-com.
 *
 * @example
 *
 * ```js
 * const commits = await getSymmetricDifference('main', 'next', { options })
 * ```
 *
 * @param {string} leftRef
 * @param {string} rightRef
 */
export async function getSymmetricDifference(leftRef, rightRef, { options }) {
  return unwrap(await $`git log ${options} ${leftRef}...${rightRef}`).split(
    '\n'
  )
}

/**
 * Find out if a line from `git log --graph` is just UI:
 *
 * ```bash
 * * 1b0b9a9 | chore: update dependencies
 * |\  # This is just UI
 * | * 3a4b5c6 (HEAD -> release/3.6, origin/release/3.6) chore: update dependencies
 * ```
 *
 * @param {string} line
 * @returns
 */
export function isLineUI(line) {
  return MARKS.some((mark) => line.startsWith(mark))
}

/**
 * Marks used in `git log --graph` that are just UI.
 */
export const MARKS = ['o', ' /', '|\\', '| o', '|\\|']

export const HASH = /\s(?<hash>\w{40})\s/
export const PR = /#(?<pr>\d+)/

/**
 * See if a commit is a chore via it's message.
 *
 * @example
 *
 * ```js
 * isCommitChore('chore: update yarn.lock')
 * // true
 * ```
 *
 * @param {string} line
 */
export function isCommitChore(line) {
  return (
    /Merge branch (?<branch>.*)/.test(line) ||
    CHORE_MESSAGES.some((message) => line.includes(message))
  )
}

const CHORE_MESSAGES = [
  'chore: update yarn.lock',
  'Version docs',
  'chore: update all contributors',
]

export const ANNOTATED_TAG_MESSAGE = /^v\d.\d.\d$/

/**
 * Given a commit's hash, get it's message.
 *
 * ```js
 * await getCommitMessage('0bb0f8ce075ea1e0f6a7851d80df2bc7d303e756')
 * 'chore(deps): update babel monorepo (#6779)'
 * ```
 *
 * @param {string} hash
 */
export async function getCommitMessage(hash) {
  return unwrap(await $`git log --format=%s -n 1 ${hash}`)
}

/**
 * Takes the return of getSymmetricDifference.
 *
 * @param {string[]} stdout
 * @param {{ from: string, to: string }} fromTo
 * @param {{ refsToColors?: Record<string, () => string> }} options
 *
 * @typedef {'commit' | 'ui' | 'chore' | 'tag'} CommitTypes
 *
 * @typedef {{
 * line: string,
 * ref: string,
 * type: CommitTypes,
 * pretty: string,
 * }} AnnotatedCommit
 *
 * @return {AnnotatedCommit[]} annotatedCommits
 */
export async function annotateSymmetricDifference(
  lines,
  { from, to },
  { refsToColors } = {}
) {
  const commits = []

  for (const line of lines) {
    const commit = {
      line,
      ref: from,
      type: 'commit',
      pretty: line,
    }

    commits.push(commit)

    if (isLineUI(line)) {
      commit.type = 'ui'
      commit.pretty = chalk.dim(line)
      continue
    }

    commit.hash = line.match(HASH).groups.hash
    commit.message = await getCommitMessage(commit.hash)
    commit.pr = commit.message.match(PR)?.groups.pr

    if (isCommitChore(line)) {
      commit.type = 'chore'
      commit.pretty = chalk.dim(line)
      continue
    }

    if (ANNOTATED_TAG_MESSAGE.test(commit.message)) {
      commit.ref = commit.message
      commit.type = 'tag'
      commit.pretty = chalk.dim(commit.line)
      continue
    }

    to = Array.isArray(to) ? to : [to]

    for (const ref of to) {
      const prettyFn = refsToColors?.[ref]
        ? chalk.dim.hex(refsToColors[ref])
        : chalk.bgBlue.gray

      if (await isCommitInRef(ref, sanitizeMessage(commit.message))) {
        commit.ref = ref
        commit.pretty = prettyFn(commit.line)
      }
    }

    console.log()
  }

  return commits
}

export async function getCurrentBranch() {
  return (await $`git branch --show-current`).stdout.trim()
}

export function isYes(res) {
  return ['', 'Y', 'y'].includes(res)
}

export async function openCherryPickPRs() {
  await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Aopen+label%3Acherry-pick`
}

export async function getMilestone(title) {
  const {
    repository: {
      milestones: { nodes },
    },
  } = await this.octokit.graphql(getMilestoneQuery, { title })

  return nodes[0]
}

const getMilestoneQuery = `
  query GetMilestoneQuery($title: String) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(
        query: $title
        first: 1
        orderBy: { field: NUMBER, direction: DESC }
      ) {
        nodes {
          title
          id
          number
        }
      }
    }
  }
`

/**
 *
 * @param {string} question
 * @param {boolean} defaultValue
 */
export async function confirm(question, defaultValue = true) {
  await question(
    [`${question}?`, defaultValue ? '[Y/n]' : '[y/N]', '> '].join(' ')
  )
}
