#!/usr/bin/env node

// Coordinates the worker processes: running attached in [work] mode or
// detaching in [start] mode.

import type { ChildProcess } from 'node:child_process'
import { fork, exec } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { setTimeout } from 'node:timers'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { loadEnvFiles } from '@redwoodjs/cli-helpers/dist/lib/loadEnvFiles.js'

import { DEFAULT_LOGGER, PROCESS_TITLE_PREFIX } from '../consts'
import { loadJobsConfig } from '../loaders'
import type { BasicLogger } from '../types'

export type NumWorkersConfig = Array<[number, number]>

loadEnvFiles()

process.title = 'rw-jobs'

const parseArgs = (argv: string[]) => {
  const parsed: Record<string, any> = yargs(hideBin(argv))
    .usage(
      'Starts the RedwoodJob runner to process background jobs\n\nUsage: $0 <command> [options]',
    )
    .command('work', 'Start a worker and process jobs')
    .command('workoff', 'Start a worker and exit after all jobs processed')
    .command('start', 'Start workers in daemon mode')
    .command('stop', 'Stop any daemonized job workers')
    .command('restart', 'Stop and start any daemonized job workers')
    .command('clear', 'Clear the job queue')
    .demandCommand(1, 'You must specify a mode to start in')
    .example(
      '$0 start -n 2',
      'Start the job runner with 2 workers in daemon mode',
    )
    .example(
      '$0 start -n default:2,email:1',
      'Start the job runner in daemon mode with 2 workers for the "default" queue and 1 for the "email" queue',
    )
    .help().argv

  return { command: parsed._[0] }
}

// Builds up an array of arrays, with the worker config index and id based on
// how many workers should use this config. For the following config:
//
// {
//   workers: [
//     {
//       adapter: 'prisma',
//       count: 2,
//       queue: 'default',
//     },
//     {
//       adapter: 'prisma',
//       count: 1,
//       queue: 'email',
//     },
//   ]
// }
//
// The output would be:
//
// [
//   [0, 0],
//   [0, 1],
//   [1, 0],
// ]
const buildNumWorkers = (config: any) => {
  // @ts-ignore who cares
  const workers = config.map((worker: any, index: number) => {
    for (let id = 0; id < worker.count; id++) {
      return [index, id]
    }
  })

  return workers
}

const startWorkers = ({
  numWorkers,
  detach = false,
  workoff = false,
  logger,
}: {
  numWorkers: NumWorkersConfig
  detach?: boolean
  workoff?: boolean
  logger: BasicLogger
}) => {
  logger.warn(`Starting ${numWorkers.length} worker(s)...`)

  return numWorkers.map(([index, id]) => {
    // list of args to send to the forked worker script
    const workerArgs: string[] = []
    workerArgs.push('--index', index.toString())
    workerArgs.push('--id', id.toString())

    if (workoff) {
      workerArgs.push('--workoff')
    }

    // fork the worker process
    // TODO squiggles under __dirname, but import.meta.dirname blows up when running the process
    const worker = fork(path.join(__dirname, 'rw-jobs-worker.js'), workerArgs, {
      detached: detach,
      stdio: detach ? 'ignore' : 'inherit',
      env: process.env,
    })

    if (detach) {
      worker.unref()
    } else {
      // children stay attached so watch for their exit before exiting parent
      worker.on('exit', (_code) => {})
    }

    return worker
  })
}

// TODO add support for stopping with SIGTERM or SIGKILL?
const stopWorkers = async ({
  numWorkers,
  // @ts-ignore who cares
  workerConfig,
  signal = 'SIGINT',
  logger,
}: {
  numWorkers: NumWorkersConfig
  signal: string
  logger: BasicLogger
}) => {
  logger.warn(
    `Stopping ${numWorkers.length} worker(s) gracefully (${signal})...`,
  )

  for (const [index, id] of numWorkers) {
    const queue = workerConfig[index].queue
    const workerTitle = `${PROCESS_TITLE_PREFIX}${queue ? `.${queue}` : ''}.${id}`
    const processId = await findProcessId(workerTitle)

    if (!processId) {
      logger.warn(`No worker found with title ${workerTitle}`)
      continue
    }

    logger.info(
      `Stopping worker ${workerTitle} with process id ${processId}...`,
    )
    process.kill(processId, signal)

    // wait for the process to actually exit before going to next iteration
    while (await findProcessId(workerTitle)) {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
}

const clearQueue = ({ logger }: { logger: BasicLogger }) => {
  logger.warn(`Starting worker to clear job queue...`)
  fork(path.join(__dirname, 'worker.js'), ['--clear'])
}

const signalSetup = ({
  workers,
  logger,
}: {
  workers: Array<ChildProcess>
  logger: BasicLogger
}) => {
  // Keep track of how many times the user has pressed ctrl-c
  let sigtermCount = 0

  // If the parent receives a ctrl-c, tell each worker to gracefully exit.
  // If the parent receives a second ctrl-c, exit immediately.
  process.on('SIGINT', () => {
    sigtermCount++
    let message =
      'SIGINT received: shutting down workers gracefully (press Ctrl-C again to exit immediately)...'

    if (sigtermCount > 1) {
      message = 'SIGINT received again, exiting immediately...'
    }

    logger.info(message)

    workers.forEach((worker) => {
      sigtermCount > 1 ? worker.kill('SIGTERM') : worker.kill('SIGINT')
    })
  })
}

// Find the process id of a worker by its title
const findProcessId = async (name: string): Promise<number | null> => {
  return new Promise(function (resolve, reject) {
    const plat = process.platform
    const cmd =
      plat === 'win32'
        ? 'tasklist'
        : plat === 'darwin'
          ? 'ps -ax | grep ' + name
          : plat === 'linux'
            ? 'ps -A'
            : ''
    if (cmd === '' || name === '') {
      resolve(null)
    }
    exec(cmd, function (err, stdout) {
      if (err) {
        reject(err)
      }

      const list = stdout.trim().split('\n')
      const matches = list.filter((line) => {
        if (plat == 'darwin' || plat == 'linux') {
          return !line.match('grep')
        }
        return true
      })
      if (matches.length === 0) {
        resolve(null)
      } else {
        resolve(parseInt(matches[0].split(' ')[0]))
      }
    })
  })
}

const main = async () => {
  const { command } = parseArgs(process.argv)
  let jobsConfig

  try {
    jobsConfig = (await loadJobsConfig()).jobs
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const workerConfig = jobsConfig.workers
  const numWorkers = buildNumWorkers(workerConfig)
  const logger = jobsConfig.logger ?? DEFAULT_LOGGER

  logger.warn(`Starting RedwoodJob Runner at ${new Date().toISOString()}...`)

  switch (command) {
    case 'start':
      startWorkers({
        numWorkers,
        detach: true,
        logger,
      })
      return process.exit(0)
    case 'restart':
      // @ts-ignore who cares
      await stopWorkers({ numWorkers, workerConfig, signal: 'SIGINT', logger })
      startWorkers({
        numWorkers,
        detach: true,
        logger,
      })
      return process.exit(0)
    case 'work':
      return signalSetup({
        workers: startWorkers({
          numWorkers,
          logger,
        }),
        logger,
      })
    case 'workoff':
      return signalSetup({
        workers: startWorkers({
          numWorkers,
          workoff: true,
          logger,
        }),
        logger,
      })
    case 'stop':
      return await stopWorkers({
        numWorkers,
        // @ts-ignore who cares
        workerConfig,
        signal: 'SIGINT',
        logger,
      })
    case 'clear':
      return clearQueue({ logger })
  }
}

main()
