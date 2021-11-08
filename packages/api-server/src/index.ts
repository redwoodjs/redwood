#!/usr/bin/env node
import yargs from 'yargs'

import { apiCliOptions, apiServerHandler } from './cliHandlers'

apiServerHandler(yargs.options(apiCliOptions).argv)
