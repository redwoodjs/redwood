export const command = 'setup <commmand>'
export const description = 'Initialize project config and install packages'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./setup', { recurse: true, exclude: /ui\/.*\.js$/ })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#setup'
      )}`
    )
