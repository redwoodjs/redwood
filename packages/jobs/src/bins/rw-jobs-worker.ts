#!/usr/bin/env node

// The process that actually starts an instance of Worker to process jobs.
// Can be run independently with `yarn rw-jobs-worker` but by default is forked
// by `yarn rw-jobs` and either monitored, or detached to run independently.
import console from 'node:console'
import process from 'node:process'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  DEFAULT_DELETE_FAILED_JOBS,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_MAX_RUNTIME,
  DEFAULT_SLEEP_DELAY,
  DEFAULT_WORK_QUEUE,
  DEFAULT_LOGGER,
  PROCESS_TITLE_PREFIX,
} from '../consts'
import { Worker } from '../core/Worker'
import { AdapterNotFoundError, WorkerConfigIndexNotFoundError } from '../errors'
import { loadJobsManager } from '../loaders'
import type { BasicLogger } from '../types'

const parseArgs = (argv: string[]) => {
  return yargs(hideBin(argv))
    .usage(
      'Starts a single RedwoodJob worker to process background jobs\n\nUsage: $0 [options]',
    )
    .option('index', {
      type: 'number',
      description:
        'The index of the `workers` property from the exported `jobs` config to use to configure this worker',
      default: 0,
    })
    .option('id', {
      type: 'number',
      description: 'The worker count id to identify this worker',
      default: 0,
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
    .help().argv
}

const setProcessTitle = ({
  id,
  queue,
}: {
  id: number
  queue: string | string[]
}) => {
  process.title = `${PROCESS_TITLE_PREFIX}.${[queue].flat().join('-')}.${id}`
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
  const { index, id, clear, workoff } = await parseArgs(process.argv)

  let jobsConfig

  try {
    jobsConfig = await loadJobsManager()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const workerConfig = jobsConfig.workers[index]

  // Exit if the indexed worker options doesn't exist
  if (!workerConfig) {
    throw new WorkerConfigIndexNotFoundError(index)
  }

  const adapter = jobsConfig.adapters[workerConfig.adapter]

  // Exit if the named adapter isn't exported
  if (!adapter) {
    throw new AdapterNotFoundError(workerConfig.adapter)
  }

  // Use worker logger, or jobs worker, or fallback to console
  const logger = workerConfig.logger ?? jobsConfig.logger ?? DEFAULT_LOGGER

  logger.info(
    `[${process.title}] Starting work at ${new Date().toISOString()}...`,
  )

  setProcessTitle({ id, queue: workerConfig.queue })

  const worker = new Worker({
    adapter,
    logger,
    maxAttempts: workerConfig.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    maxRuntime: workerConfig.maxRuntime ?? DEFAULT_MAX_RUNTIME,
    sleepDelay: workerConfig.sleepDelay ?? DEFAULT_SLEEP_DELAY,
    deleteFailedJobs:
      workerConfig.deleteFailedJobs ?? DEFAULT_DELETE_FAILED_JOBS,
    processName: process.title,
    queues: [workerConfig.queue ?? DEFAULT_WORK_QUEUE].flat(),
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
