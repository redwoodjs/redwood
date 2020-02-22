export const command = 'generate <type>'
export const aliases = ['g']
export const desc = 'Save time by generating boilerplate code.'

export const builder = (yargs) =>
  yargs
    .commandDir('./generate/commands')
    .demandCommand(
      2,
      2,
      'You need at least two commands to use `generate`',
      'You entered too many commands. Maybe you used a space in your directory name?'
    ).argv
