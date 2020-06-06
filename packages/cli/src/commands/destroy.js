export const command = 'destroy <type>'
export const aliases = ['d']
export const description = 'Rollback changes made by the generate command'

export const builder = (yargs) =>
  yargs.commandDir('./destroy', { recurse: true }).demandCommand()
