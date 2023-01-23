import opentelemetry from '@opentelemetry/api'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { tracerName } from '../telemetry/const'

export const command = 'check'
export const aliases = ['diagnostics']
export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export const handler = async () => {
  const tracer = opentelemetry.trace.getTracer(tracerName)
  const handlerSpan = tracer.startSpan(
    'handler',
    undefined,
    opentelemetry.context.active()
  )
  handlerSpan.setAttribute('command', 'check')
  const { printDiagnostics, DiagnosticSeverity } = await import(
    '@redwoodjs/structure'
  )

  printDiagnostics(getPaths().base, {
    getSeverityLabel: (severity) => {
      if (severity === DiagnosticSeverity.Error) {
        return c.error('error')
      }
      if (severity === DiagnosticSeverity.Warning) {
        return c.warning('warning')
      }
      return c.info('info')
    },
  })
  handlerSpan.end()
}
