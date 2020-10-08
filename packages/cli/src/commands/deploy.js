export const command = 'deploy <command>'
export const description = 'Deploy your Redwood project'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./deploy', { recurse: true })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#deploy'
      )}`
    )
