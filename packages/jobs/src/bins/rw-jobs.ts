#!/usr/bin/env node

// Coordinates the worker processes: running attached in [work] mode or
// detaching in [start] mode.
import console from 'node:console'
import process from 'node:process'

import type { ChildProcess } from 'node:child_process'
import { fork, exec } from 'node:child_process'
import path from 'node:path'
import { setTimeout } from 'node:timers'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

// @ts-expect-error - doesn't understand dual CJS/ESM export
import * as cliHelperLoadEnv from '@redwoodjs/cli-helpers/loadEnvFiles'
const { loadEnvFiles } = cliHelperLoadEnv

import { DEFAULT_LOGGER, PROCESS_TITLE_PREFIX } from '../consts'
import { loadJobsManager } from '../loaders'
import type { Adapters, BasicLogger, WorkerConfig } from '../types'

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
//   [0, 0], // first array, first worker
//   [0, 1], // first array, second worker
//   [1, 0], // second array, first worker
// ]
const buildNumWorkers = (config: any) => {
  const workers: NumWorkersConfig = []

  config.map((worker: any, index: number) => {
    for (let id = 0; id < worker.count; id++) {
      workers.push([index, id])
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

  const processIds = await findWorkerProcesses()

  if (processIds.length === 0) {
    logger.warn(`No running workers found.`)
    return
  }

  for (const processId of processIds) {
    logger.info(`Stopping process id ${processId}...`)
    process.kill(processId, signal)

    // wait for the process to actually exit before going to next iteration
    while ((await findWorkerProcesses(processId)).length) {
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
const findWorkerProcesses = async (id?: number): Promise<number[]> => {
  return new Promise(function (resolve, reject) {
    const plat = process.platform
    const cmd =
      plat === 'win32'
        ? 'tasklist'
        : plat === 'darwin'
          ? 'ps -ax | grep ' + PROCESS_TITLE_PREFIX
          : plat === 'linux'
            ? 'ps -A'
            : ''
    if (cmd === '') {
      resolve([])
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

      // no job workers running
      if (matches.length === 0) {
        resolve([])
      }

      const pids = matches.map((line) => parseInt(line.split(' ')[0]))

      if (id) {
        // will return the single job worker process ID if still running
        resolve(pids.filter((pid) => pid === id))
      } else {
        // return all job worker process IDs
        resolve(pids)
      }
    })
  })
}

const main = async () => {
  const { command } = parseArgs(process.argv)
  let jobsConfig

  try {
    jobsConfig = await loadJobsManager()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const workerConfig: WorkerConfig<Adapters, string[]>[] = jobsConfig.workers
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
      await stopWorkers({ numWorkers, signal: 'SIGINT', logger })
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
        signal: 'SIGINT',
        logger,
      })
    case 'clear':
      return clearQueue({ logger })
  }
}

// Don't actaully run the worker if we're in a test environment
if (process.env.NODE_ENV !== 'test') {
  main()
}
