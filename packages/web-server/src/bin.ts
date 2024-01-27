import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { bin } from '../package.json'

import { description, builder } from './cliConfig'
import { handler } from './cliConfigHandler'

const [scriptName] = Object.keys(bin)

yargs(hideBin(process.argv))
  .scriptName(scriptName)
  .strict()
  // @ts-expect-error The yargs types seem wrong; it's ok for builder to be a function
  .command('$0', description, builder, handler)
  .parse()
