import fs from 'fs'
import path from 'path'

import yargs from 'yargs'
// @ts-expect-error is actually exported, just not in types
import { decamelize } from 'yargs-parser'

export const command = 'list <rwVersion>'
export const description = 'List available codemods for a specific version'

export const aliases = ['ls']

export const builder = (yargs: yargs.Argv) => {
  yargs.positional('rwVersion', {
    type: 'string',
    required: true,
    choices: fs
      .readdirSync(__dirname)
      .filter((file) => !fs.statSync(path.join(__dirname, file)).isFile()), // Only list the folders
  })
}

export const handler = ({ rwVersion }: { rwVersion: string }) => {
  console.log('Listing codemods for', rwVersion)

  console.log()

  const modsForVersion = fs.readdirSync(path.join(__dirname, rwVersion))

  modsForVersion.forEach((codemod) => {
    // Use decamelize to match the usual yargs names,
    // instead of having to load the .yargs files
    console.log(`- npx @redwoodjs/codemods ${decamelize(codemod)}`)
  })
}
