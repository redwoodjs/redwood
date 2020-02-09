export const command = 'generate <type>'
export const alias = 'g'
export const desc = 'Save time by generating boilerplate code.'

export const builder = (yargs) =>
  yargs.commandDir('./generate/commands').demandCommand().argv
