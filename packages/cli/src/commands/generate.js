export const command = 'generate <type>'
export const aliases = ['g']
export const desc = 'Save time by generating boilerplate code.'

export const builder = (yargs) =>
  yargs.commandDir('./generate', { recurse: true }).demandCommand().argv
