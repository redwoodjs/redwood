export const command = 'db <command>'
export const desc = 'Database tools.'

export const builder = (yargs) =>
  yargs.commandDir('./dbCommands').demandCommand().argv
