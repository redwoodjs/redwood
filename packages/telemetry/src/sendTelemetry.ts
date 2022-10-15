import fs from 'fs'
import path from 'path'

import ci from 'ci-info'
import { fetch } from 'cross-undici-fetch'
import envinfo from 'envinfo'
import system from 'systeminformation'
import { v4 as uuidv4 } from 'uuid'

// circular dependency when trying to import @redwoodjs/structure so lets do it
// the old fashioned way
const { DefaultHost } = require('@redwoodjs/structure/dist/hosts')
const { RWProject } = require('@redwoodjs/structure/dist/model/RWProject')

interface SensitiveArgPositions {
  exec: {
    positions: Array<number>
    options?: never
    redactWith: Array<string>
  }
  g: {
    positions: Array<number>
    options?: never
    redactWith: Array<string>
  }
  generate: {
    positions: Array<number>
    options?: never
    redactWith: Array<string>
  }
  prisma: {
    positions?: never
    options: Array<string>
    redactWith: Array<string>
  }
}

// Tracks any commands that could contain sensitive info and their position in
// the argv array, as well as the text to replace them with
const SENSITIVE_ARG_POSITIONS: SensitiveArgPositions = {
  exec: {
    positions: [1],
    redactWith: ['[script]'],
  },
  g: {
    positions: [2, 3],
    redactWith: ['[name]', '[path]'],
  },
  generate: {
    positions: [2, 3],
    redactWith: ['[name]', '[path]'],
  },
  prisma: {
    options: ['--name'],
    redactWith: ['[name]'],
  },
}

interface Args {
  redwoodVersion?: string
}

/** Gets diagnostic info and sanitizes by removing references to paths */
const getInfo = async (presets: Args = {}) => {
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
    os: info.System?.OS?.split(' ')[0],
    osVersion: info.System?.OS?.split(' ')[1],
    shell: info.System?.Shell?.name,
    nodeVersion: info.Binaries?.Node?.version,
    yarnVersion: info.Binaries?.Yarn?.version,
    npmVersion: info.Binaries?.npm?.version,
    vsCodeVersion: info.IDEs?.VSCode?.version,
    redwoodVersion:
      presets.redwoodVersion || info.npmPackages['@redwoodjs/core']?.installed,
    system: `${cpu.physicalCores}.${Math.round(mem.total / 1073741824)}`,
  }
}

// removes potentially sensitive information from an array of argv strings
export const sanitizeArgv = (
  argv: [string, string, keyof SensitiveArgPositions, ...string[]]
) => {
  const name = argv[2]
  const sensitiveCommand = SENSITIVE_ARG_POSITIONS[name]
  const args = argv.slice(2)

  if (sensitiveCommand) {
    // redact positional arguments
    if (sensitiveCommand.positions) {
      sensitiveCommand.positions.forEach((pos: number, index: number) => {
        // only redact if the text in the given position is not a --flag
        if (args[pos] && !/--/.test(args[pos])) {
          args[pos] = sensitiveCommand.redactWith[index]
        }
      })
    }

    // redact --option arguments
    if (sensitiveCommand.options) {
      sensitiveCommand.options.forEach((option: string, index: number) => {
        const argIndex = args.indexOf(option)
        if (argIndex !== -1) {
          args[argIndex + 1] = sensitiveCommand.redactWith[index]
        }
      })
    }
  }

  return args.join(' ')
}

const buildPayload = async () => {
  let payload: Record<string, unknown> = {}
  let project

  const argv = require('yargs/yargs')(process.argv.slice(2)).argv
  const rootDir = argv.root
  payload = {
    type: argv.type || 'command',
    command: argv.argv ? sanitizeArgv(JSON.parse(argv.argv)) : '',
    duration: argv.duration ? parseInt(argv.duration) : null,
    uid: uniqueId(rootDir) || null,
    ci: ci.isCI,
    redwoodCi: !!process.env.REDWOOD_CI,
    NODE_ENV: process.env.NODE_ENV || null,
    ...(await getInfo({ redwoodVersion: argv.rwVersion })),
  }

  if (argv.error) {
    payload.type = 'error'
    payload.error = argv.error
      .split('\n')[0]
      .replace(/(\/[@\-\.\w]+)/g, '[path]')
  }

  // if a root directory was specified, use that to look up framework stats
  // with the `structure` package
  if (rootDir) {
    project = new RWProject({
      projectRoot: rootDir,
      host: new DefaultHost(),
    })
  }

  // add in app stats
  payload = {
    ...payload,
    complexity: `${project.getRouter().routes.length}.${
      project.services.length
    }.${project.cells.length}.${project.pages.length}`,
    sides: project.sides.join(','),
  }

  return payload
}

// returns the UUID for this device. caches the UUID for 24 hours
const uniqueId = (rootDir: string | null) => {
  const telemetryCachePath = path.join(
    rootDir || '/tmp',
    '.redwood',
    'telemetry.txt'
  )
  const now = Date.now()
  const expires = now - 24 * 60 * 60 * 1000 // one day
  let uuid

  if (
    !fs.existsSync(telemetryCachePath) ||
    fs.statSync(telemetryCachePath).mtimeMs < expires
  ) {
    uuid = uuidv4()
    try {
      fs.writeFileSync(telemetryCachePath, uuid)
    } catch (error) {
      console.error('\nCould not create telemetry.txt file\n')
    }
  } else {
    uuid = fs.readFileSync(telemetryCachePath).toString()
  }

  return uuid
}

// actually call the API with telemetry data
export const sendTelemetry = async () => {
  const telemetryUrl = 'https://telemetry.redwoodjs.com/api/v1/telemetry'

  try {
    const payload = await buildPayload()

    if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
      console.info('Redwood Telemetry Payload', payload)
    }

    const response = await fetch(telemetryUrl, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
      console.info('Redwood Telemetry Response:', response)
    }

    // Normally we would report on any non-error response here (like a 500)
    // but since the process is spawned and stdout/stderr is ignored, it can
    // never be seen by the user, so ignore.
    if (process.env.REDWOOD_VERBOSE_TELEMETRY && response.status !== 200) {
      console.error('Error from telemetry insert:', await response.text())
    }
  } catch (e) {
    // service interruption: network down or telemetry API not responding
    // don't let telemetry errors bubble up to user, just do nothing.
    if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
      console.error('Uncaught error in telemetry:', e)
    }
  }
}
