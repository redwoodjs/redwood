import path from 'path'

import fs from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

import { unsetLock } from '../lib/locking'

import { computeTelemetryInfo } from './compute'

async function main() {
  const telemetryComputeFile = path.join(
    getPaths().generated.base,
    'telemetryCompute.json'
  )
  fs.ensureFileSync(telemetryComputeFile)

  const data = await computeTelemetryInfo()

  fs.writeFileSync(telemetryComputeFile, JSON.stringify(data, undefined, 2))
  unsetLock('TELEMETRY_COMPUTE')
}
main()
