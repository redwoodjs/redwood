import ci from 'ci-info'
import envinfo from 'envinfo'
import fetch from 'node-fetch'

import { getProject } from '@redwoodjs/structure'

import { getConfig } from './config'

// Tracks any commands that could contain sensative info and theor position in
// the argv array, as well as the text to replace them with
const SENSATIVE_ARG_POSITIONS = {
  exec: {
    positions: [1],
    redactWith: '[script]',
  },
  g: {
    positions: [2],
    redactWith: '[name]',
  },
  generate: {
    positions: [2],
    redactWith: '[name]',
  },
}

// gets diagnostic info and sanitizes by removing references to paths
const getInfo = async () => {
  const info = JSON.parse(
    await envinfo.run(
      {
        System: ['OS', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        npmPackages: '@redwoodjs/*',
        IDEs: ['VSCode'],
      },
      { json: true }
    )
  )

  // get shell name instead of path
  if (info.System.Shell.path.match('/')) {
    info.System.Shell.name = info.System.Shell.path.split('/').pop()
  } else if (info.System.Shell.path.match('\\')) {
    info.System.Shell.name = info.System.Shell.path.split('\\').pop()
  }

  // remove paths to binaries
  delete info.Binaries?.Node?.path
  delete info.Binaries?.Yarn?.path
  delete info.Binaries?.npm?.path
  delete info.System?.Shell?.path
  delete info.IDEs?.VSCode?.path

  return info
}

// removes potentially sensative information from an array of argv strings
const sanitizeArgv = (argv) => {
  const args = argv.slice(2)
  const name = args[0]
  const sensativeCommand = SENSATIVE_ARG_POSITIONS[name]

  if (sensativeCommand) {
    sensativeCommand.positions.forEach((pos) => {
      args[pos] = sensativeCommand.redactWith
    })
  }

  return args.join(' ')
}

// wrap a function in this call to get a telemetry hit including how long it took
export const timedTelemetry = async (argv, func) => {
  const start = new Date()
  const result = await func.call()
  const duration = new Date() - start

  await telemetry(argv, { duration })

  return result
}

// used as yargs middleware when any command is invoked
export const telemetryMiddleware = async () => {
  await telemetry(process.argv)
}

// command that actually sends prepared data to telemetry collection service
export const telemetry = async (argv, data = {}) => {
  if (process.env.REDWOOD_DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) {
    return
  }

  const payload = {
    type: data.type || 'command',
    command: sanitizeArgv(argv),
    ci: ci.isCI,
    duration: data.duration,
    info: await getInfo(),
    nodeEnv: process.env.NODE_ENV || null,
    routeCount: getProject().getRouter().routes.length,
  }

  console.info('payload', payload)

  try {
    await fetch(getConfig().telemetry.url, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    // do nothing if telemetry can't be saved—network or server is down!
    // console.error(e)
  }
}
