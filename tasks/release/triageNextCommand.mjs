/* eslint-env node */

import { fileURLToPath } from 'node:url'

import { chalk, question, $ } from 'zx'

import {
  annotateSymmetricDifference,
  consoleBoxen,
  defaultGitLogOptions,
  getReleaseBranch,
  getSymmetricDifference,
  isYes,
  logSection,
  purgeCommitData,
  reportNewCommits,
  setupData,
  triageCommits,
  updateRemotes,
} from './releaseLib.mjs'

export const command = 'triage-next'
export const description = 'Triage commits from next to the release branch'

export function builder(yargs) {
  return yargs.option('update-remotes', {
    description: 'Update remotes',
    type: 'boolean',
  })
}

export async function handler({ updateRemotes: shouldUpdateRemotes }) {
  const releaseBranch = await getReleaseBranch()
  console.log()

  if (releaseBranch.split('\n').length > 1) {
    console.log("There's more than one release branch")
    process.exitCode = 1
    return
  }

  const data = setupData(
    fileURLToPath(new URL('data/triageNextData.json', import.meta.url))
  )

  logSection('Update remotes\n')

  await $`git remote -v`
  console.log()

  shouldUpdateRemotes ??= isYes(
    await question(
      `Update remotes? ${chalk.gray(
        "(You'll want to if you haven't in a while)"
      )} [Y/n] > `
    )
  )
  console.log()

  if (shouldUpdateRemotes) {
    await updateRemotes()
  }

  // ------------------------
  logSection(`Getting symmetric difference between next and ${releaseBranch}\n`)

  const lines = await getSymmetricDifference('next', releaseBranch, {
    options: [
      ...defaultGitLogOptions,
      '--left-only',
      '--cherry-pick',
      '--boundary',
    ],
  })
  console.log()

  consoleBoxen(
    '💁 Tip',
    [
      'This is the "symmetric difference" between main and next ("main...next").',
      "Basically, it's what's different about them. It's the commits main has that next doesn't,",
      'and vice versa.',
      '',
      `Since we passed "--left-only", we're only seeing commits unique to main.`,
      "But it's very likely that some of these commits have already been cherry picked into next.",
      "The reason they're showing up as unique to main is that they were changed while cherry picking.",
      "We'll find out which ones, if any, in the next step.",
    ].join('\n')
  )
  console.log()

  await question(chalk.gray('Hit enter to continue'))
  console.log()

  if (lines.length === 1 && lines[0] === '') {
    consoleBoxen(
      '🙈 Nothing to see here',
      `The ${chalk.magenta('next')} and ${chalk.magenta(
        releaseBranch
      )} branches are the same`
    )
    data.clear()
    return
  }

  const annotatedCommits = await annotateSymmetricDifference(lines, {
    from: 'next',
    to: releaseBranch,
  })

  let releaseCommits = annotatedCommits.filter(
    (commit) => !['ui', 'chore', 'tag'].includes(commit.type)
  )

  consoleBoxen(
    '💁 Tip',
    [
      'This script just annotated each of these commits.',
      '',
      "It ran `git log` using each these commits' hash to get the commit's full message.",
      'Then it used the message to grep the next branch for a commit of the same message.',
      '(So this workflow absolutely depends on keeping the commit message the same!)',
      '',
      'To scan the output above...',
      "• if you see three lines, the commit _wasn't_ cherry picked into next",
      '• if you see four+ lines, the commit _was_ cherry picked into next',
    ].join('\n')
  )
  console.log()

  await question(chalk.gray('Hit enter to continue'))
  console.log()

  // ------------------------
  logSection('Purging commit data\n')
  await purgeCommitData(data, {
    commits: releaseCommits,
    branch: releaseBranch,
  })

  // Remove commits we've already triaged or cherry picked (but had to change while cherry picking)
  releaseCommits = releaseCommits
    .filter(({ hash }) => !data.has(hash))
    .filter(({ ref }) => ref !== releaseBranch)

  if (!releaseCommits.length) {
    logSection('No new commits to triage; showing colored-coded git log\n')

    consoleBoxen(
      '🔑 Key',
      [
        `${chalk.green('■')} Needs to be cherry picked`,
        `${chalk.dim.blue('■')} Cherry picked into ${releaseBranch}`,
        `${chalk.dim.red('■')} Doesn't need to be cherry picked`,
        `${chalk.dim('■')} Chore or "boundary" commit (ignore)`,
        `${chalk.yellow(
          '■'
        )} Not in the commit data file (needs to be manually triaged)`,
      ].join('\n')
    )
    console.log()

    annotatedCommits
      .filter((commit) => !['ui', 'chore', 'tag'].includes(commit.type))
      .filter((commit) => commit.ref !== releaseBranch)
      .forEach((commit) => {
        if (!data.has(commit.hash)) {
          commit.pretty = chalk.yellow(commit.line)
          return
        }

        if (data.get(commit.hash).needsCherryPick) {
          commit.pretty = chalk.green(commit.line)
          return
        }

        commit.pretty = chalk.dim.red(commit.line)
      })

    console.log(annotatedCommits.map(({ pretty }) => pretty).join('\n'))

    return
  }

  // ------------------------
  logSection('Triage\n')

  reportNewCommits(releaseCommits, { from: 'next', to: releaseBranch })
  console.log()
  await triageCommits(releaseCommits, { data, branch: releaseBranch })
}
