export const command = 'db <command>'
export const aliases = ['database']
export const desc = 'Database tools.'

export const builder = (yargs) =>
  yargs
    .commandDir('./dbCommands')
    .demandCommand(1, 1, 'You need at least one command when using `db`').argv
