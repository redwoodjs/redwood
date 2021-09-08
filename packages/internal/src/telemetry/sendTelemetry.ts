import ci from 'ci-info'
import envinfo from 'envinfo'
import fetch from 'node-fetch'
import system from 'systeminformation'

import { getConfig } from '../config'
import { getPaths } from '../paths'

// circular dependency when trying to import @redwoodjs/structure so lets do it
// the old fashioned way
const { DefaultHost } = require('../../../structure/dist/hosts')
const { RWProject } = require('../../../structure/dist/model/RWProject')

interface SensitiveArgPositions {
  exec: {
    positions: Array<number>
    redactWith: Array<string>
  }
  g: {
    positions: Array<number>
    redactWith: Array<string>
  }
  generate: {
    positions: Array<number>
    redactWith: Array<string>
  }
}

// Tracks any commands that could contain sensative info and their position in
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
}

// gets diagnostic info and sanitizes by removing references to paths
export const getInfo = async () => {
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

  const cpu = await system.cpu()
  const mem = await system.mem()

  return {
    os: info.System.OS.split(' ')[0],
    osVersion: info.System.OS.split(' ')[1],
    shell: info.System.Shell.name,
    nodeVersion: info.Binaries.Node.version,
    yarnVersion: info.Binaries.Node.version,
    npmVersion: info.Binaries.Node.version,
    vsCodeVersion: info.IDEs.VSCode.version,
    redwoodVersion: info.npmPackages['@redwoodjs/core'].installed,
    system: `${cpu.physicalCores}.${Math.round(mem.total / 1073741824)}`,
  }
}

// removes potentially sensative information from an array of argv strings
export const sanitizeArgv = (argv: Array<string>) => {
  const args = argv.slice(2)
  const name = args[0]
  const sensativeCommand =
    SENSITIVE_ARG_POSITIONS[name as keyof SensitiveArgPositions]

  if (sensativeCommand) {
    sensativeCommand.positions.forEach((pos: number, index: number) => {
      // only redact if the text in the given position is not a --flag
      if (args[pos] && !args[pos].match(/--/)) {
        args[pos] = sensativeCommand.redactWith[index]
      }
    })
  }

  return args.join(' ')
}

export const buildPayload = async () => {
  const argv = require('yargs/yargs')(process.argv.slice(2)).argv
  let type = argv.type || 'command'
  let error = argv.error

  if (argv.error) {
    type = 'error'
    error = error.split('\n')[0].replace(/(\/[@\-\.\w]+)/g, '[path]')
  }

  const project = new RWProject({
    projectRoot: getPaths().base,
    host: new DefaultHost(),
  })

  return {
    type,
    command: sanitizeArgv(JSON.parse(argv.argv)),
    ci: ci.isCI,
    duration: argv.duration ? parseInt(argv.duration) : null,
    error: error,
    NODE_ENV: process.env.NODE_ENV || null,
    complexity: `${project.getRouter().routes.length}.${
      project.services.length
    }.${project.cells.length}.${project.pages.length}`,
    sides: project.sides.join(','),
    ...(await getInfo()),
  }
}

// actual telemetry send process
;(async function () {
  const telemetryConfig = getConfig().telemetry

  try {
    const payload = await buildPayload()

    if (process.env.REDWOOD_VERBOSE_TELEMETRY) {
      console.info('Redwood Telemetry Payload', payload)
    }

    const response = await fetch(telemetryConfig.url, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    // Normally we would report on any non-error response here (like a 500)
    // but since the process is spawned and stdout/stderr is ignored, it can
    // never be seen by the user, so ignore
    // if (response.status !== 201) {
    //   console.error('Error from telemetry insert:', await response.text())
    // }
  } catch (e) {
    // service interruption: network down or telemetry API not responding
    // don't let telemetry errors bubble up to user, just do nothing
    // TODO: remove before merging for real
    console.error('Uncaught error in telemetry:', e)
  }
})()
