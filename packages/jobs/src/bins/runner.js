#!/usr/bin/env node

// Coordinates the worker processes: running attached in [work] mode or
// detaching in [start] mode.

import { fork, exec } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { setTimeout } from 'node:timers'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { loadEnvFiles } from '@redwoodjs/cli/dist/lib/loadEnvFiles'

import { loadLogger } from '../core/loaders'

loadEnvFiles()

process.title = 'rw-job-runner'

const parseArgs = (argv) => {
  const parsed = yargs(hideBin(argv))
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

  return { numWorkers: parsed.n, command: parsed._[0] }
}

const buildWorkerConfig = (numWorkers) => {
  // Builds up an array of arrays, with queue name and id:
  //   `-n default:2,email:1` => [ ['default', 0], ['default', 1], ['email', 0] ]
  // If only given a number of workers then queue name is an empty string:
  //   `-n 2` => [ ['', 0], ['', 1] ]
  let workers = []

  // default to one worker for commands that don't specify
  if (!numWorkers) {
    numWorkers = '1'
  }

  // if only a number was given, convert it to a nameless worker: `2` => `:2`
  if (!isNaN(parseInt(numWorkers))) {
    numWorkers = `:${numWorkers}`
  }

  // split the queue:num pairs and build the workers array
  numWorkers.split(',').forEach((count) => {
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
}) => {
  logger.warn(`Starting ${workerConfig.length} worker(s)...`)

  return workerConfig.map(([queue, id], i) => {
    // list of args to send to the forked worker script
    const workerArgs = ['--id', id]

    // add the queue name if present
    if (queue) {
      workerArgs.push('--queue', queue)
    }

    // are we in workoff mode?
    if (workoff) {
      workerArgs.push('--workoff')
    }

    // fork the worker process
    const worker = fork(path.join(__dirname, 'worker.js'), workerArgs, {
      detached: detach,
      stdio: detach ? 'ignore' : 'inherit',
    })

    if (detach) {
      worker.unref()
    } else {
      // children stay attached so watch for their exit
      worker.on('exit', (_code) => {})
    }

    return worker
  })
}

const signalSetup = ({ workers, logger }) => {
  // if we get here then we're still monitoring workers and have to pass on signals
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

const findProcessId = async (proc) => {
  return new Promise(function (resolve, reject) {
    const plat = process.platform
    const cmd =
      plat === 'win32'
        ? 'tasklist'
        : plat === 'darwin'
          ? 'ps -ax | grep ' + proc
          : plat === 'linux'
            ? 'ps -A'
            : ''
    if (cmd === '' || proc === '') {
      resolve(false)
    }
    exec(cmd, function (err, stdout, _stderr) {
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
        resolve(false)
      } else {
        resolve(parseInt(matches[0].split(' ')[0]))
      }
    })
  })
}

// TODO add support for stopping with SIGTERM or SIGKILL?
const stopWorkers = async ({ workerConfig, signal = 'SIGINT', logger }) => {
  logger.warn(
    `Stopping ${workerConfig.length} worker(s) gracefully (${signal})...`,
  )

  for (const [queue, id] of workerConfig) {
    const workerTitle = `rw-job-worker${queue ? `.${queue}` : ''}.${id}`
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

const clearQueue = ({ logger }) => {
  logger.warn(`Starting worker to clear job queue...`)
  fork(path.join(__dirname, 'worker.js'), ['--clear'])
}

const main = async () => {
  const { numWorkers, command } = parseArgs(process.argv)
  const workerConfig = buildWorkerConfig(numWorkers)
  const logger = await loadLogger()

  logger.warn(`Starting RedwoodJob Runner at ${new Date().toISOString()}...`)

  switch (command) {
    case 'start':
      startWorkers({ workerConfig, detach: true, logger })
      return process.exit(0)
    case 'restart':
      await stopWorkers({ workerConfig, signal: 2, logger })
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
      return clearQueue()
  }
}

main()
