#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { description, builder, handler } from './setup'

yargs(hideBin(process.argv)).command('*', description, builder, handler).parse()
