exports.command = 'ui <library>'
exports.desc = 'Set up a UI design or style library'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./ui')
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#ui'
      )}`
    )
