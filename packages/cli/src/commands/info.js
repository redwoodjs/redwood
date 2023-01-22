// inspired by gatsby/packages/gatsby-cli/src/create-cli.js and
// and gridsome/packages/cli/lib/commands/info.js
import opentelemetry from '@opentelemetry/api'
import envinfo from 'envinfo'
import terminalLink from 'terminal-link'

import { tracerName } from '../telemetry/const'

export const command = 'info'
export const description = 'Print your system environment information'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#info'
    )}`
  )
}
export const handler = async () => {
  const tracer = opentelemetry.trace.getTracer(tracerName)
  const handlerSpan = tracer.startSpan(
    'handler',
    undefined,
    opentelemetry.context.active()
  )
  handlerSpan.setAttribute('command', 'info')
  try {
    const output = await envinfo.run({
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn'],
      Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
      // yarn workspaces not supported :-/
      npmPackages: '@redwoodjs/*',
      Databases: ['SQLite'],
    })
    console.log(output)
    handlerSpan.end()
  } catch (e) {
    console.log('Error: Cannot access environment info')
    console.log(e)
    handlerSpan.recordException(e)
    handlerSpan.end()
    process.exit(1)
  }
}
