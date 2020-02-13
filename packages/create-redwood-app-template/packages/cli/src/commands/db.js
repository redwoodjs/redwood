export const command = 'db <command>'
export const aliases = ['database']
export const desc = 'Database tools.'

export const builder = (yargs) =>
  yargs.commandDir('./dbCommands').demandCommand().argv
