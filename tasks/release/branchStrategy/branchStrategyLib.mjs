/* eslint-env node, es2022 */

import boxen from 'boxen'
import { $, fs, question, chalk } from 'zx'

export function setupCache(file) {
  let cache

  try {
    cache = JSON.parse(fs.readFileSync(file, 'utf-8'))
    cache = new Map(Object.entries(cache))
  } catch {
    cache = new Map()
  }

  process.on('exit', () => {
    fs.writeFileSync(file, JSON.stringify(Object.fromEntries(cache), null, 2))
  })

  return cache
}

export const GIT_LOG_OPTIONS = [
  '--graph',
  '--oneline',
  '--boundary',
  '--cherry-pick',
  '--left-only',
]

export const HASH = /\w{9}/
export const PR = /#(?<pr>\d*)/

export function parseCommit(commit) {
  const match = commit.match(HASH)
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

export async function isCommitInBranch(branch, message) {
  const { stdout } = await $`git log ${branch} --oneline --grep ${message}`
  return Boolean(stdout)
}

export function reportNewCommits(commits) {
  console.log(
    [
      `There's ${commits.length} commits in the main branch that aren't in the next branch:`,
      '',
      commits
        .map((commit) => {
          const { hash, message } = parseCommit(commit)
          return `${chalk.bold(chalk.yellow(hash))} ${message}`
        })
        .join('\n'),
      '',
    ].join('\n')
  )
}

export async function triageCommits(commits) {
  for (let commit of commits) {
    const { hash, message, pr } = parseCommit(commit)

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const answer = await question(
        `Does ${chalk.bold(chalk.yellow(hash))} ${chalk.cyan(
          message
        )} need to be cherry picked into ${this.branch}? [Y/n/o(pen)] > `
      )

      commit = this.cache.get(hash)

      if (answer === 'o' || answer === 'open') {
        await $`open https://github.com/redwoodjs/redwood/pull/${pr}`
        continue
      }

      this.cache.set(hash, {
        message: message,
        needsCherryPick: answer === '' || answer === 'y' || answer === 'Y',
      })

      break
    }
  }
}

export const GIT_LOG_UI = ['o', ' /', '|\\', '| o']

export async function getReleaseBranch() {
  const { stdout: gitBranchStdout } = await $`git branch --list release/*`

  if (gitBranchStdout.trim().split('\n').length > 1) {
    console.log()
    console.log("There's more than one release branch")
    process.exit(1)
  }

  return gitBranchStdout.trim()
}

export async function purgeCache(cache, commits, branch) {
  const commitHashes = commits.map((commit) => parseCommit(commit).hash)

  for (const cachedHash of cache.keys()) {
    if (!commitHashes.includes(cachedHash)) {
      cache.delete(cachedHash)
    }
  }

  const needsCherryPick = [...cache.entries()].filter(
    ([, { needsCherryPick }]) => needsCherryPick
  )

  for (const [hash, { message }] of needsCherryPick) {
    if (await isCommitInBranch(branch, message)) {
      cache.delete(hash)
    }
  }
}

export async function updateRemotes() {
  await $`git remote update`
  console.log()

  const { stdout: main } = await $`git rev-list main...origin/main --count`
  console.log()

  if (parseInt(main.trim())) {
    await $`git fetch origin main:main`
    console.log()
  }

  const { stdout: next } = await $`git rev-list next...origin/next --count`
  console.log()

  if (parseInt(next.trim())) {
    await $`git fetch origin next:next`
    console.log()
  }
}

export function colorKeyBox(colorKey) {
  return boxen(colorKey, {
    title: 'Key',
    padding: 1,
    margin: 1,
    borderStyle: 'round',
  })
}
