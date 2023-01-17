/* eslint-env node, es2022 */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { $, chalk, path } from 'zx'

import {
  colorKeyBox,
  GIT_LOG_OPTIONS,
  isCommitInBranch,
  parseCommit,
  purgeCache,
  reportNewCommits,
  setupCache,
  triageCommits,
  updateRemotes,
} from './branchStrategyLib.mjs'

export const command = 'triage-main'
export const description = 'Triage commits from main to next'

export async function handler() {
  const cache = setupCache(
    path.join(dirname(fileURLToPath(import.meta.url)), 'triageMainCache.json')
  )

  await updateRemotes()

  let { stdout } = await $`git log ${GIT_LOG_OPTIONS} main...next`
  console.log()

  stdout = stdout.trim().split('\n')

  let commits = stdout
    .filter((line) => !line.startsWith('o'))
    .filter((line) => !line.includes('chore: update all contributors'))

  await purgeCache(cache, commits, 'next')

  // Remove commits we've already triaged
  commits = commits.filter((line) => {
    const { hash } = parseCommit(line)
    return !cache.has(hash)
  })

  const commitsInNext = await commits.reduce(async (arr, commit) => {
    arr = await arr

    const { hash, message } = parseCommit(commit)

    if (await isCommitInBranch('next', message)) {
      arr.push(hash)
    }

    return arr
  }, Promise.resolve([]))
  console.log()

  commits = commits.filter(
    (commit) => !commitsInNext.includes(parseCommit(commit).hash)
  )

  if (!commits.length) {
    console.log('No new commits to triage')

    console.log(
      colorKeyBox(
        [
          `${chalk.green('■')} Needs to be cherry picked`,
          `${chalk.dim(
            chalk.red('■')
          )} Breaking or builds on breaking (don't cherry pick)`,
          `${chalk.dim(chalk.blue('■'))} Cherry picked into next`,
          `${chalk.dim('■')} Chore or "boundary" commit (ignore)`,
          `${chalk.yellow(
            '■'
          )} Not in the cache (needs to be manually triaged)`,
        ].join('\n')
      )
    )

    stdout.forEach((line, i) => {
      if (
        line.startsWith('o') ||
        line.includes('chore: update all contributors')
      ) {
        stdout[i] = chalk.dim(line)
        return
      }

      if (commitsInNext.includes(parseCommit(line).hash)) {
        stdout[i] = chalk.dim(chalk.blue(line))
        return
      }

      const { hash } = parseCommit(line)

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

  await triageCommits.call({ cache, branch: 'next' }, commits)
}
