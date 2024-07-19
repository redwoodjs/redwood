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

import { loadWorkerConfig } from '../core/loaders'
import { Worker } from '../core/Worker'
import type { BasicLogger } from '../types'

const TITLE_PREFIX = `rw-jobs-worker`

const parseArgs = (argv: string[]) => {
  return yargs(hideBin(argv))
    .usage(
      'Starts a single RedwoodJob worker to process background jobs\n\nUsage: $0 [options]',
    )
    .option('id', {
      alias: 'i',
      type: 'number',
      description: 'The worker ID',
      default: 0,
    })
    .option('queue', {
      alias: 'q',
      type: 'string',
      description: 'The named queue to work on',
      default: null,
    })
    .option('workoff', {
      alias: 'o',
      type: 'boolean',
      default: false,
      description: 'Work off all jobs in the queue and exit',
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      default: 'workerConfig',
      description: 'Name of the exported variable containing the worker config',
    })
    .option('clear', {
      alias: 'd',
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
  const { id, queue, config, clear, workoff } = await parseArgs(process.argv)
  setProcessTitle({ id, queue })

  let workerConfig

  try {
    workerConfig = await loadWorkerConfig(config)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const logger = workerConfig.logger || console

  logger.info(
    `[${process.title}] Starting work at ${new Date().toISOString()}...`,
  )

  const worker = new Worker({
    ...workerConfig,
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
