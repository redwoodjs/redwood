export const command = 'db <command>'
export const aliases = ['database']
export const description = 'Database tools'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./dbCommands')
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db'
      )}`
    )
