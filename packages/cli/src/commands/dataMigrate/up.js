import terminalLink from 'terminal-link'

export const command = 'up'
export const description =
  'Run any outstanding Data Migrations against the database'

/**
 * @param {import('@types/yargs').Argv} yargs
 */
export function builder(yargs) {
  yargs
    .option('strategy', {
      type: 'string',
      alias: 's',
      default: 'requireHook',
      choices: ['requireHook', 'dist'],
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#datamigrate-up'
      )}`
    )
}

export async function handler(options) {
  const { handler } = await import('./upHandler')
  return handler(options)
}
