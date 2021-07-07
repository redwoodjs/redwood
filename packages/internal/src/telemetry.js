import ci from 'ci-info'
import envinfo from 'envinfo'
import fetch from 'node-fetch'

import { getProject } from '@redwoodjs/structure'

// command that actually sends prepared data to telemetry collection service
export const telemetry = async (args = {}) => {
  if (process.env.REDWOOD_DISABLE_TELEMETRY || process.env.DO_NOT_TRACK) {
    return
  }

  const info = await envinfo.run(
    {
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm'],
      npmPackages: '@redwoodjs/*',
      IDEs: ['VSCode'],
    },
    { json: true }
  )

  const payload = {
    type: args.type || 'command',
    command: args.command,
    ci: ci.isCI,
    diagnostics: JSON.parse(info),
    duration: args.duration,
    routeCount: getProject().getRouter().routes.length,
  }

  console.info('payload', payload)

  try {
    await fetch('http://99d5d59fb25a.ngrok.io/api/v1/telemetry', {
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
  func.call()
  const duration = new Date() - start
  await telemetry({ type: 'timer', command, duration })
}

// used as yargs middleware when any command is invoked
export const telemetryMiddleware = async (argv) => {
  await telemetry({ command: argv })
}
