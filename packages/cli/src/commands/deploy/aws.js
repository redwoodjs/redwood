import terminalLink from 'terminal-link'

export const command = 'aws <provider>'
export const description = 'Deploy to AWS using the selected provider'
export const builder = (yargs) => {
  yargs
    .commandDir('./aws-providers', {
      recurse: true,
      /*
    @NOTE This regex will ignore all double nested commands
    e.g. /setup/hi.js & setup/hi/hi.js are picked up,
    but setup/hi/hello/bazinga.js will be ignored
    The [\/\\] bit is for supporting both windows and unix style paths
    */
      exclude: /aws-providers[\/\\]+.*[\/\\]+.*[\/\\]/,
    })
    .option('sides', {
      describe: 'which Side(s) to deploy',
      choices: ['api', 'web'],
      default: ['api', 'web'],
      alias: 'side',
      type: 'array',
    })
    .option('verbose', {
      describe: 'verbosity of logs',
      default: true,
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
}
