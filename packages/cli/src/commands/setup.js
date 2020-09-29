import terminalLink from 'terminal-link'
export const command = 'setup <option>'
export const description =
  'Initialize project configuration with one-time setup commands.'

export const builder = (yargs) =>
  yargs
    .commandDir('./setup', { recurse: true })
    .choices('i18n', 'tailwind')
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#setup'
      )}`
    )

export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
}
