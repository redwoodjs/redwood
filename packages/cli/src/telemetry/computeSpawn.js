import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

import { getLockAge, unsetLock, isLockSet } from '../lib/locking'

import { computeTelemetryInfo } from './compute'

async function main() {
  const telemetryComputeFile = path.join(
    getPaths().generated.base,
    'telemetryCompute.json'
  )
  fs.ensureFileSync(telemetryComputeFile)

  // Don't recompute if we're in the middle of a computation
  if (
    isLockSet('TELEMETRY_COMPUTE') &&
    getLockAge('TELEMETRY_COMPUTE') < 5000
  ) {
    return
  }

  try {
    const data = await computeTelemetryInfo()
    fs.writeFileSync(telemetryComputeFile, JSON.stringify(data, undefined, 2))
  } finally {
    unsetLock('TELEMETRY_COMPUTE')
  }
}
main()
