/* eslint-env node, es2022 */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { $, path, chalk } from 'zx'

import {
  updateRemotes,
  setupCache,
  GIT_LOG_OPTIONS,
  GIT_LOG_UI,
  purgeCache,
  parseCommit,
  isCommitInBranch,
  reportNewCommits,
  triageCommits,
  getReleaseBranch,
  colorKeyBox,
} from './branchStrategyLib.mjs'

export const command = 'triage-next'
export const description = 'Triage commits from next to the release branch'

export async function handler() {
  await updateRemotes()

  const branch = await getReleaseBranch()
  console.log()

  const cache = setupCache(
    path.join(dirname(fileURLToPath(import.meta.url)), 'triageNextCache.json')
  )

  let { stdout } = await $`git log ${GIT_LOG_OPTIONS} next...${branch}`

  if (!stdout) {
    console.log(`The next and ${branch} branches are the same`)
    cache.clear()
    return
  }

  console.log()

  stdout = stdout.trim().split('\n')

  let commits = stdout
    .filter((line) => !GIT_LOG_UI.some((mark) => line.startsWith(mark)))
    // Remove any commits that are chores from merging a release branch back into the next branch.
    .filter((line) => !line.includes('chore: update yarn.lock'))
    .filter((line) => !/Merge branch (?<branch>.*) into next/.test(line))
    .filter((line) => {
      const { message } = parseCommit(line)
      return !TAG_COMMIT_MESSAGE.test(message)
    })

  await purgeCache(cache, commits, branch)

  // ?

  // Remove commits we've already triaged
  commits = commits.filter((line) => {
    const { hash } = parseCommit(line)
    return !cache.has(hash)
  })

  const commitsInRelease = await commits.reduce(async (arr, commit) => {
    arr = await arr

    const { hash, message } = parseCommit(commit)

    if (await isCommitInBranch(branch, message)) {
      arr.push(hash)
    }

    return arr
  }, Promise.resolve([]))
  console.log()

  commits = commits.filter(
    (commit) => !commitsInRelease.includes(parseCommit(commit).hash)
  )

  if (!commits.length) {
    console.log('No new commits to triage')

    console.log(
      colorKeyBox(
        [
          `${chalk.green('■')} Needs to be cherry picked`,
          `${chalk.dim(chalk.red('■'))} Doesn't need to be cherry picked)`,
          `${chalk.dim(chalk.blue('■'))} Cherry picked into ${branch}`,
          `${chalk.dim('■')} Chore or "boundary" commit (ignore)`,
          `${chalk.yellow(
            '■'
          )} Not in the cache (needs to be manually triaged)`,
        ].join('\n')
      )
    )

    stdout.forEach((line, i) => {
      if (
        GIT_LOG_UI.some((mark) => line.startsWith(mark)) ||
        line.includes('chore: update yarn.lock') ||
        /Merge branch (?<branch>.*) into next/.test(line)
      ) {
        stdout[i] = chalk.dim(line)
        return
      }

      const { hash, message } = parseCommit(line)

      if (TAG_COMMIT_MESSAGE.test(message)) {
        stdout[i] = chalk.dim(line)
        return
      }

      if (commitsInRelease.includes(parseCommit(line).hash)) {
        stdout[i] = chalk.dim(chalk.blue(line))
        return
      }

      if (!cache.has(hash)) {
        stdout[i] = chalk.yellow(line)
        return
      }

      if (cache.get(hash).needsCherryPick) {
        stdout[i] = chalk.green(line)
        return
      }

      stdout[i] = chalk.dim(chalk.red(line))
    })

    console.log(stdout.join('\n'))

    return
  }

  reportNewCommits(commits)

  await triageCommits.call({ cache, branch }, commits)
}

const TAG_COMMIT_MESSAGE = /^v\d.\d.\d$/
