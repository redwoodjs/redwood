import terminalLink from 'terminal-link'

import detectRwVersion from '../middleware/detectProjectRwVersion'

export const command = 'setup <commmand>'
export const description = 'Initialize project config and install packages'

export const builder = (yargs) =>
  yargs
    .commandDir('./setup', {
      recurse: true,
      /*
      @NOTE This regex will ignore all double nested commands
      e.g. /setup/hi.js & setup/hi/hi.js are picked up,
      but setup/hi/hello/bazinga.js will be ignored
      The [\/\\] bit is for supporting both windows and unix style paths
      */
      exclude: /setup[\/\\]+.*[\/\\]+.*[\/\\]/,
    })
    .demandCommand()
    .middleware(detectRwVersion)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#setup'
      )}`
    )
