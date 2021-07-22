import { getPaths } from '../lib'
import c from '../lib/colors'

export const command = 'check'
export const aliases = ['diagnostics']
export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export const handler = async () => {
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
}
