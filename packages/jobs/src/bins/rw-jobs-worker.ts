#!/usr/bin/env node

// The process that actually starts an instance of Worker to process jobs.
// Can be run independently with `yarn rw-jobs-worker` but by default is forked
// by `yarn rw-jobs` and either monitored, or detached to run independently.
//
// If you want to get fancy and have different workers running with different
// configurations, you need to invoke this script manually and pass the --config
// option with the name of the named export from api/src/lib/jobs.js
import console from 'node:console'
import process from 'node:process'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  DEFAULT_DELETE_FAILED_JOBS,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_RUNTIME,
  DEFAULT_SLEEP_DELAY,
  DEFAULT_ADAPTER_NAME,
  DEFAULT_LOGGER_NAME,
} from '../core/consts'
import { AdapterNotFoundError, LoggerNotFoundError } from '../core/errors'
import { loadJobsConfig } from '../core/loaders'
import { Worker } from '../core/Worker'
import type { BasicLogger } from '../types'

const TITLE_PREFIX = `rw-jobs-worker`

const parseArgs = (argv: string[]) => {
  return yargs(hideBin(argv))
    .usage(
      'Starts a single RedwoodJob worker to process background jobs\n\nUsage: $0 [options]',
    )
    .option('id', {
      type: 'number',
      description: 'The worker ID',
      default: 0,
    })
    .option('queue', {
      type: 'string',
      description: 'The named queue to work on',
      default: null,
    })
    .option('workoff', {
      type: 'boolean',
      default: false,
      description: 'Work off all jobs in the queue and exit',
    })
    .option('clear', {
      type: 'boolean',
      default: false,
      description: 'Remove all jobs in the queue and exit',
    })
    .option('maxAttempts', {
      type: 'number',
      default: DEFAULT_MAX_ATTEMPTS,
      description: 'The maximum number of times a job can be attempted',
    })
    .option('maxRuntime', {
      type: 'number',
      default: DEFAULT_MAX_RUNTIME,
      description: 'The maximum number of seconds a job can run',
    })
    .option('sleepDelay', {
      type: 'number',
      default: DEFAULT_SLEEP_DELAY,
      description:
        'The maximum number of seconds to wait between polling for jobs',
    })
    .option('deleteFailedJobs', {
      type: 'boolean',
      default: DEFAULT_DELETE_FAILED_JOBS,
      description:
        'Whether to remove failed jobs from the queue after max attempts',
    })
    .option('adapter', {
      type: 'string',
      default: DEFAULT_ADAPTER_NAME,
      description:
        'Name of the exported variable from the jobs config file that contains the adapter',
    })
    .option('logger', {
      type: 'string',
      description:
        'Name of the exported variable from the jobs config file that contains the adapter',
    })
    .help().argv
}

const setProcessTitle = ({
  id,
  queue,
}: {
  id: number
  queue: string | null
}) => {
  // set the process title
  let title = TITLE_PREFIX
  if (queue) {
    title += `.${queue}.${id}`
  } else {
    title += `.${id}`
  }

  process.title = title
}

const setupSignals = ({
  worker,
  logger,
}: {
  worker: Worker
  logger: BasicLogger
}) => {
  // if the parent itself receives a ctrl-c it'll pass that to the workers.
  // workers will exit gracefully by setting `forever` to `false` which will tell
  // it not to pick up a new job when done with the current one
  process.on('SIGINT', () => {
    logger.warn(
      `[${process.title}] SIGINT received at ${new Date().toISOString()}, finishing work...`,
    )
    worker.forever = false
  })

  // if the parent itself receives a ctrl-c more than once it'll send SIGTERM
  // instead in which case we exit immediately no matter what state the worker is
  // in
  process.on('SIGTERM', () => {
    logger.info(
      `[${process.title}] SIGTERM received at ${new Date().toISOString()}, exiting now!`,
    )
    process.exit(0)
  })
}

const main = async () => {
  const {
    id,
    queue,
    clear,
    workoff,
    maxAttempts,
    maxRuntime,
    sleepDelay,
    deleteFailedJobs,
    adapter: adapterName,
    logger: loggerName,
  } = await parseArgs(process.argv)
  setProcessTitle({ id, queue })

  let jobsConfig

  // Pull the complex config options we can't pass on the command line directly
  // from the app's jobs config file: `adapter` and `logger`. Remaining config
  // is passed as command line flags. The rw-jobs script pulls THOSE config
  // options from the jobs config, but if you're not using that script you need
  // to pass manually. Calling this script directly is ADVANCED USAGE ONLY!
  try {
    jobsConfig = await loadJobsConfig()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  // Exit if the named adapter isn't exported
  if (!jobsConfig[adapterName]) {
    throw new AdapterNotFoundError(adapterName)
  }

  // Exit if the named logger isn't exported (if one was provided)
  if (loggerName && !jobsConfig[loggerName]) {
    throw new LoggerNotFoundError(loggerName)
  }

  // if a named logger was provided, use it, otherwise fall back to the default
  // name, otherwise just use the console
  const logger = loggerName
    ? jobsConfig[loggerName]
    : jobsConfig[DEFAULT_LOGGER_NAME] || console

  logger.info(
    `[${process.title}] Starting work at ${new Date().toISOString()}...`,
  )

  const worker = new Worker({
    adapter: jobsConfig[adapterName],
    logger,
    maxAttempts,
    maxRuntime,
    sleepDelay,
    deleteFailedJobs,
    processName: process.title,
    queue,
    workoff,
    clear,
  })

  worker.run().then(() => {
    logger.info(`[${process.title}] Worker finished, shutting down.`)
    process.exit(0)
  })

  setupSignals({ worker, logger })
}

main()
