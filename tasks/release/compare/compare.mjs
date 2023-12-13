/* eslint-env node */

// Sometimes it's hard to tell where commits land. (The minor? The patch? The previous minor...?)
// This script gives you fine-grained information to work with to figure that out.
//
// Why's it hard to tell? Because...
//
// - sometimes you have to revert a commit; since most of the tooling here operates on git commit messages,
//   the commit message will still be in git's history, even though the commit isn't in the release
// - when you release a patch, you cherry pick commits from the `next` branch into the release branch,
//   but they'll be in the `next` branch's history (because it constitutes the next minor)

import { parseArgs as _parseArgs } from 'node:util'

import { within, $ } from 'zx'

import {
  consoleBoxen,
  compareRange,
  getLatestRelease,
  getReleaseBranches,
  prompts,
  setVerbosity,
  unwrap,
} from '../releaseLib.mjs'

export async function main() {
  let options

  try {
    options = await parseArgs()
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }

  const { verbose, range, colorSeed } = options

  setVerbosity(verbose)

  // The colors are randomly chosen, and sometimes they're not great. In those cases, use `--color-seed` to tweak things.
  await compareRange(range, { colorSeed })
}

main()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseArgs() {
  const { values } = _parseArgs({
    options: {
      'color-seed': {
        type: 'string',
        short: 'o',
        default: '0',
      },

      verbose: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
    },
  })

  const colorSeed = parseInt(values['color-seed'])

  if (Number.isNaN(colorSeed)) {
    throw new Error(
      `\`--color-seed\` should be a number (you passed in \`${values['color-seed']}\`)`
    )
  }

  const range = await getRange()

  // Spreading `values` here adds `color-seed`.
  return {
    range,
    colorSeed,
    verbose: values.verbose,
  }
}

async function getRange() {
  const releaseBranches = await getReleaseBranches()

  let vMajorReleases = ['main', 'next', ...releaseBranches]

  // Get all the releases since the last major.
  await within(async () => {
    $.verbose = false

    const [vMajor] = (await getLatestRelease()).split('.')

    vMajorReleases = [
      ...vMajorReleases,
      ...unwrap(await $`git tag -l ${vMajor}.?.?`)
        .split('\n')
        .reverse(),
    ]
  })

  // Get rid of `v?.0.0`.
  const choices = vMajorReleases.slice(0, -1).map((ref) => {
    return {
      title: ref,
      value: ref,
    }
  })

  let rangeFromRes = await prompts({
    type: 'select',
    name: 'from',
    message: 'Compare from?',
    choices,
  })

  const range = {
    from: rangeFromRes.from,
  }

  const rangeToRes = await prompts({
    type: 'multiselect',
    name: 'to',
    message: 'Compare to?',

    // Get rid of `main` and what the user chose above.
    // TODO: technically, we should get rid of any vMajorReleases that are "greater"  than the user's choice.
    choices: choices.slice(1).filter((choice) => choice.value !== range.from),
    min: 1,

    // These are the default instructions with a space added to the end.
    // With the defaults, if the user doesn't select an option, the error renders right next to the last line:
    //
    // ```
    // enter/return: Complete answerYou must select a minimum of 1 choices.
    // ```
    instructions: [
      'Instructions:',
      '    ↑/↓: Highlight option',
      '    ←/→/[space]: Toggle selection',
      '    a: Toggle all',
      '    enter/return: Complete answer ',
    ].join('\n'),
  })

  range.to = rangeToRes.to

  return range
}
