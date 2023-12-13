/* eslint-env node */
import { parseArgs as _parseArgs } from 'node:util'

import { chalk, fs, question } from 'zx'

import { prompts, resolveLine } from '../releaseLib.mjs'

async function main() {
  const { filePath, lines } = await parseArgs()

  const [from, to] = filePath.split('.')[0].split('_')

  for (const line of lines) {
    console.log(chalk.dim('='.repeat(process.stdout.columns)))
    console.log(line)
    console.log()

    await resolveLine(line, {
      range: {
        from,
        to: [to],
      },
      refsToColorFunctions: {
        [to]: chalk.bgBlue.gray,
      },
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

  return {
    filePath: filePathPrompt.filePath,
    lines: linesPrompt.lines,
  }
}
