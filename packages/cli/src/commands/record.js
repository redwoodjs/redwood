export const command = 'record <command>'
export const description =
  'Setup RedwoodRecord for your project. Caches a JSON version of your data model and adds api/src/models/index.js with some config.'
import terminalLink from 'terminal-link'

export async function builder(yargs) {
  const recordInitCommand = await import('./record/init')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'RedwoodRecord Docs',
        'https://redwoodjs.com/docs/redwoodrecord'
      )}\n`
    )
    .command(recordInitCommand)
}
