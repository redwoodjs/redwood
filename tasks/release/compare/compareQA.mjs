/* eslint-env node */
import { parseArgs as _parseArgs } from 'node:util'

import { faker } from '@faker-js/faker'
import { chalk, fs, question, within, $ } from 'zx'

import {
  getLatestRelease,
  getReleaseBranches,
  prompts,
  resolveLine,
  unwrap,
} from '../releaseLib.mjs'

async function main() {
  const { lines, range } = await parseArgs()

  for (const line of lines) {
    console.log(chalk.dim('='.repeat(process.stdout.columns)))
    console.log(line)
    console.log()

    await resolveLine(line, {
      range,
      refsToColorFunctions: range.to.reduce((refsToColorFunctions, ref) => {
        refsToColorFunctions[ref] = chalk.bgHex(faker.color.rgb())
        return refsToColorFunctions
      }, {}),
      logger: console.log,
    })

    console.log()
    await question('Press anything to continue > ')
  }
}

main()

async function parseArgs() {
  // Get the file path.
  const dirents = await fs.readdir(new URL('.', import.meta.url), {
    withFileTypes: true,
  })

  const filePathChoices = dirents
    .filter(
      (dirent) =>
        dirent.isFile() && dirent.name.endsWith('symmetricDifference.json')
    )
    .map((dirent) => {
      return {
        title: dirent.name,
        value: dirent.name,
      }
    })

  const filePathPrompt = await prompts({
    name: 'filePath',
    message: 'Choose a file',
    type: 'select',
    choices: filePathChoices,
  })

  // Get the lines.
  let lines = await fs.readJSON(
    new URL(filePathPrompt.filePath, import.meta.url)
  )

  const linesChoices = lines.map((line) => {
    return {
      title: line,
      value: line,
    }
  })

  const linesPrompt = await prompts({
    name: 'lines',
    message: 'Which lines do you want to QA?',
    type: 'autocompleteMultiselect',
    choices: linesChoices,
    async suggest(input, choices) {
      return Promise.resolve(
        choices.filter(({ title }) => title.includes(input))
      )
    },
    min: 1,
  })

  // Get the refs.
  // TODO: a lot of the code here could be deduplicated.
  let [from, to] = filePathPrompt.filePath
    .replace('.symmetricDifference.json', '')
    .split('_')

  from = from.replaceAll('-', '/')
  to = to.replaceAll('-', '/')

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

  const refsPrompt = await prompts({
    type: 'multiselect',
    name: 'to',
    message: 'Compare to?',

    choices: choices.filter(
      (choice) => choice.value !== from && choice.value !== to
    ),
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

  // The logic for transforming `refs` into ascending order is here in this file
  // beacuse we call `resolveLine` directly.
  const refs = [to, ...refsPrompt.to].reverse()

  return {
    lines: linesPrompt.lines,
    range: {
      from,
      to: refs,
    },
  }
}
