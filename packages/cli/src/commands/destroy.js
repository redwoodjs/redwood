export const command = 'destroy <type>'
export const aliases = ['d']
export const desc = 'Rollback changes made by generate command.'

export const builder = (yargs) =>
  yargs.commandDir('./destroy', { recurse: true }).demandCommand().argv
