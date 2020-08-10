import { printDiagnostics, DiagnosticSeverity } from '@redwoodjs/structure'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'diagnostics'
export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export const handler = async () => {
  printDiagnostics(getPaths().base, { getSeverityLabel })
}

function getSeverityLabel(severity) {
  if (severity === DiagnosticSeverity.Error) return c.error('error')
  if (severity === DiagnosticSeverity.Warning) return c.warning('warning')
  return c.info('info')
}
