import path from 'path'

// @ts-expect-error not sure; other packages use this and don't provide the types
import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { getPaths } from '@redwoodjs/project-config'

import { description, builder } from './commands/up'
import { handler } from './commands/upHandler'

config({
  path: path.join(getPaths().base, '.env'),
  defaults: path.join(getPaths().base, '.env.defaults'),
  multiline: true,
})

yargs(hideBin(process.argv))
  .scriptName('data-migrate')
  // @ts-expect-error not sure; this is a valid signature
  .command('$0', description, builder, handler)
  .parse()
