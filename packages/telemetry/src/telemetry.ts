import { spawn } from 'child_process'
import os from 'os'
import path from 'path'

import { getPaths } from '@redwoodjs/internal/dist/paths'

const spawnProcess = (...args: Array<string>) => {
  spawn(
    process.execPath,
    [
      path.join(__dirname, 'scripts', 'invoke.js'),
      ...args,
      '--root',
      getPaths().base,
    ],
    {
      detached: process.env.REDWOOD_VERBOSE_TELEMETRY ? false : true,
      stdio: process.env.REDWOOD_VERBOSE_TELEMETRY ? 'inherit' : 'ignore',
      windowsHide: true,
    }
  ).unref()
}

// wrap a function in this call to get a telemetry hit including how long it took
export const timedTelemetry = async (
  argv: Array<string>,
  options: Record<string, unknown>,
  func: (...args: any[]) => any
) => {
  if (process.env.REDWOOD_DISABLE_TELEMETRY) {
    return func.call(this)
  }

  const start = new Date()
  const result = await func.call(this)
  const duration = new Date().getTime() - start.getTime()

  spawnProcess(
    '--argv',
    JSON.stringify(argv),
    '--duration',
    duration.toString(),
    '--type',
    JSON.stringify(options.type)
  )

  return result
}

// Returns 'Windows_NT' on Windows.
// See https://nodejs.org/docs/latest-v12.x/api/os.html#os_os_type.
const isWindows = os.type() === 'Windows_NT'

export const errorTelemetry = async (argv: Array<string>, error: any) => {
  // FIXME: on Windows, cmd opens and closes a few times.
  // See https://github.com/redwoodjs/redwood/issues/5728.
  if (isWindows || process.env.REDWOOD_DISABLE_TELEMETRY) {
    return
  }

  spawnProcess('--argv', JSON.stringify(argv), '--error', JSON.stringify(error))
}

// used as yargs middleware when any command is invoked
export const telemetryMiddleware = async () => {
  // FIXME: on Windows, cmd opens and closes a few times.
  // See https://github.com/redwoodjs/redwood/issues/5728.
  if (isWindows || process.env.REDWOOD_DISABLE_TELEMETRY) {
    return
  }

  spawnProcess('--argv', JSON.stringify(process.argv))
}
