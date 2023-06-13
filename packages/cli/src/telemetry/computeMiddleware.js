import { spawn } from 'child_process'
import os from 'os'
import path from 'path'

import { setLock } from '../lib/locking'

export function telemetryBackgroundCompute() {
  setLock('TELEMETRY_COMPUTE')
  // We must account for some platform specific behaviour on windows.
  const spawnOptions =
    os.type() === 'Windows_NT'
      ? {
          // The following options run the process in the background without a console window, even though they don't look like they would.
          // See https://github.com/nodejs/node/issues/21825#issuecomment-503766781 for information
          detached: false,
          windowsHide: false,
          shell: true,
          stdio: 'inherit',
        }
      : {
          detached: true,
          stdio: 'inherit',
        }
  const child = spawn(
    'yarn',
    ['node', path.join(__dirname, 'computeSpawn.js')],
    spawnOptions
  )
  child.unref()
}
