import ci from 'ci-info'
import envinfo from 'envinfo'
import fetch from 'node-fetch'

import { getProject } from '@redwoodjs/structure'

import { getConfig } from './config'

const getInfo = async () => {
  const info = await envinfo.run(
    {
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm'],
      npmPackages: '@redwoodjs/*',
      IDEs: ['VSCode'],
    },
    { json: true }
  )
  return JSON.parse(info)
}

// command that actually sends prepared data to telemetry collection service
export const telemetry = async (args = {}) => {
  if (process.env.REDWOOD_DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) {
    return
  }

  const payload = {
    type: args.type || 'command',
    command: args.command,
    ci: ci.isCI,
    diagnostics: await getInfo(),
    duration: args.duration || null,
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

export const timedCommand = async (command, func) => {
  const start = new Date()
  const result = await func.call()
  const duration = new Date() - start

  await telemetry({ type: 'timer', command, duration })

  return result
}

// used as yargs middleware when any command is invoked
export const telemetryMiddleware = async (argv) => {
  await telemetry({ command: argv })
}
