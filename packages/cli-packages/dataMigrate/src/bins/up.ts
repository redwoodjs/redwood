import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { command, description, builder } from '../commands/up'
import { handler } from '../commands/upHandler'

yargs(hideBin(process.argv))
  .command(command, description, builder, handler)
  .parse()
