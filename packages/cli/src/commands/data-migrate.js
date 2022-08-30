import terminalLink from 'terminal-link'

export const command = 'data-migrate <command>'
export const aliases = ['dm', 'dataMigrate']
export const description = 'Migrate the data in your database'

export async function builder(yargs) {
  const dataMigrateInstallCommand = await import('./dataMigrate/install')
  const dataMigrateUpCommand = await import('./dataMigrate/up')

  yargs
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#datamigrate'
      )}`
    )
    .command(dataMigrateInstallCommand)
    .command(dataMigrateUpCommand)
}
