import terminalLink from 'terminal-link'

export const command = 'util <util>'
export const aliases = ['u']
export const description = 'WARNING: deprecated. Use "yarn rw setup" command.'

// ********
// Deprecated as of September 2020
// Use "setup" command
// ********

export const builder = (yargs) =>
  yargs
    .commandDir('./util', { recurse: true, exclude: /util.js/ })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#setup'
      )}`
    )
