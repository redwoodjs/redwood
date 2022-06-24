export const command = 'destroy <type>'
export const aliases = ['d']
export const description = 'Rollback changes made by the generate command'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./destroy', {
      recurse: true,
      /*
      @NOTE This regex will ignore all double nested commands
      e.g. /destroy/hi.js & destroy/hi/hi.js are picked up,
      but destroy/hi/__tests__/whatever.test.js will be ignored
      The [\/\\] bit is for supporting both windows and unix style paths
      */
      exclude: /destroy[\/\\]+.*[\/\\]+.*[\/\\]/,
    })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#destroy-alias-d'
      )}`
    )
