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

import { loadLogger } from '../core/loaders'
import type { BasicLogger } from '../types'

export type WorkerConfig = Array<[string | null, number]> // [queue, id]

loadEnvFiles()

process.title = 'rw-jobs'

const parseArgs = (argv: string[]) => {
  const parsed: Record<string, any> = yargs(hideBin(argv))
    .usage(
      'Starts the RedwoodJob runner to process background jobs\n\nUsage: $0 <command> [options]',
    )
    .command('work', 'Start a worker and process jobs')
    .command('workoff', 'Start a worker and exit after all jobs processed')
    .command('start', 'Start workers in daemon mode', (yargs) => {
      yargs
        .option('n', {
          type: 'string',
          describe:
            'Number of workers to start OR queue:num pairs of workers to start (see examples)',
          default: '1',
        })
        .example(
          '$0 start -n 2',
          'Start the job runner with 2 workers in daemon mode',
        )
        .example(
          '$0 start -n default:2,email:1',
          'Start the job runner in daemon mode with 2 workers for the "default" queue and 1 for the "email" queue',
        )
    })
    .command('stop', 'Stop any daemonized job workers')
    .command(
      'restart',
      'Stop and start any daemonized job workers',
      (yargs) => {
        yargs
          .option('n', {
            type: 'string',
            describe:
              'Number of workers to start OR queue:num pairs of workers to start (see examples)',
            default: '1',
          })
          .example(
            '$0 restart -n 2',
            'Restart the job runner with 2 workers in daemon mode',
          )
          .example(
            '$0 restart -n default:2,email:1',
            'Restart the job runner in daemon mode with 2 workers for the `default` queue and 1 for the `email` queue',
          )
      },
    )
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

  return { workerDef: parsed.n, command: parsed._[0] }
}

const buildWorkerConfig = (workerDef: string): WorkerConfig => {
  // Builds up an array of arrays, with queue name and id:
  //   `-n default:2,email:1` => [ ['default', 0], ['default', 1], ['email', 0] ]
  // If only given a number of workers then queue name is null (all queues):
  //   `-n 2` => [ [null, 0], [null, 1] ]
  const workers: WorkerConfig = []

  // default to one worker for commands that don't specify
  if (!workerDef) {
    workerDef = '1'
  }

  // if only a number was given, convert it to a nameless worker: `2` => `:2`
  if (!isNaN(parseInt(workerDef))) {
    workerDef = `:${workerDef}`
  }

  // split the queue:num pairs and build the workers array
  workerDef.split(',').forEach((count: string) => {
    const [queue, num] = count.split(':')
    for (let i = 0; i < parseInt(num); i++) {
      workers.push([queue || null, i])
    }
  })

  return workers
}

const startWorkers = ({
  workerConfig,
  detach = false,
  workoff = false,
  logger,
}: {
  workerConfig: WorkerConfig
  detach?: boolean
  workoff?: boolean
  logger: BasicLogger
}) => {
  logger.warn(`Starting ${workerConfig.length} worker(s)...`)

  return workerConfig.map(([queue, id]) => {
    // list of args to send to the forked worker script
    const workerArgs: string[] = ['--id', id.toString()]

    // add the queue name if present
    if (queue) {
      workerArgs.push('--queue', queue)
    }

    // are we in workoff mode?
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

// TODO add support for stopping with SIGTERM or SIGKILL?
const stopWorkers = async ({
  workerConfig,
  signal = 'SIGINT',
  logger,
}: {
  workerConfig: WorkerConfig
  signal: string
  logger: BasicLogger
}) => {
  logger.warn(
    `Stopping ${workerConfig.length} worker(s) gracefully (${signal})...`,
  )

  for (const [queue, id] of workerConfig) {
    const workerTitle = `rw-jobs-worker${queue ? `.${queue}` : ''}.${id}`
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

const main = async () => {
  const { workerDef, command } = parseArgs(process.argv)
  const workerConfig = buildWorkerConfig(workerDef)
  const logger = await loadLogger()

  logger.warn(`Starting RedwoodJob Runner at ${new Date().toISOString()}...`)

  switch (command) {
    case 'start':
      startWorkers({ workerConfig, detach: true, logger })
      return process.exit(0)
    case 'restart':
      await stopWorkers({ workerConfig, signal: 'SIGINT', logger })
      startWorkers({ workerConfig, detach: true, logger })
      return process.exit(0)
    case 'work':
      return signalSetup({
        workers: startWorkers({ workerConfig, logger }),
        logger,
      })
    case 'workoff':
      return signalSetup({
        workers: startWorkers({ workerConfig, workoff: true, logger }),
        logger,
      })
    case 'stop':
      return await stopWorkers({ workerConfig, signal: 'SIGINT', logger })
    case 'clear':
      return clearQueue({ logger })
  }
}

main()
