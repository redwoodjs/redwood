import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { description, builder } from './commands/up'
import { handler } from './commands/upHandler'

yargs(hideBin(process.argv))
  .scriptName('data-migrate')
  // @ts-expect-error not sure why
  .command('$0', description, builder, handler)
  .parse()
