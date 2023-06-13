import path from 'path'

import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import ci from 'ci-info'
import envinfo from 'envinfo'
import fs from 'fs-extra'
import system from 'systeminformation'
import { v4 as uuidv4, validate as validateUUID } from 'uuid'

import { getPaths } from '@redwoodjs/project-config'

export async function computeTelemetryInfo() {
  // Read the UUID from the file within .redwood or generate a new one if it doesn't exist
  // or if it is too old
  let UID = uuidv4()
  try {
    const telemetryFile = path.join(getPaths().generated.base, 'telemetry.txt')
    if (!fs.existsSync(telemetryFile)) {
      fs.ensureFileSync(telemetryFile)
    }
    if (fs.statSync(telemetryFile).mtimeMs < Date.now() - 86400000) {
      // 86400000 is 24 hours in milliseconds, we rotate the UID every 24 hours
      fs.writeFileSync(telemetryFile, UID)
    } else {
      const storedUID = fs.readFileSync(telemetryFile, { encoding: 'utf8' })
      if (storedUID && validateUUID(storedUID)) {
        UID = storedUID
      } else {
        fs.writeFileSync(telemetryFile, UID)
      }
    }
  } catch (_error) {
    // TODO: Consider this error
    //   console.error('Telemetry error')
    //   console.error(error)
  }

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
  const shell = info.System?.Shell // Windows doesn't always provide shell info, I guess
  if (shell?.path?.match('/')) {
    info.System.Shell.name = info.System.Shell.path.split('/').pop()
  } else if (shell?.path.match('\\')) {
    info.System.Shell.name = info.System.Shell.path.split('\\').pop()
  }
  const cpu = await system.cpu()
  const mem = await system.mem()

  return {
    [SemanticResourceAttributes.OS_TYPE]: info.System?.OS?.split(' ')[0],
    [SemanticResourceAttributes.OS_VERSION]: info.System?.OS?.split(' ')[1],
    'shell.name': info.System?.Shell?.name,
    'node.version': info.Binaries?.Node?.version,
    'yarn.version': info.Binaries?.Yarn?.version,
    'npm.version': info.Binaries?.npm?.version,
    'vscode.version': info.IDEs?.VSCode?.version,
    'cpu.count': cpu.physicalCores,
    'memory.gb': Math.round(mem.total / 1073741824),
    'env.node_env': process.env.NODE_ENV || null,
    'ci.redwood': !!process.env.REDWOOD_CI,
    'ci.isci': ci.isCI,
    uid: UID,
  }
}
