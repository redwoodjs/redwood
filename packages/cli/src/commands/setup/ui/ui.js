import fs from 'fs'
import path from 'path'

import terminalLink from 'terminal-link'

const SUPPORTED_LIBRARY = fs
  .readdirSync(path.resolve(__dirname, 'library'))
  .map((file) => path.basename(file, '.js'))
  .filter((file) => file !== 'README.md')

export const command = 'ui <library>'
export const description = 'Set up a UI style library'
export const builder = (yargs) =>
  yargs
    .positional('library', {
      choices: SUPPORTED_LIBRARY,
      description: 'UI library to configure',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#ui'
      )}`
    )
