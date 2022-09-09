import { getPaths, colors } from '@redwoodjs/cli-helpers'

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
        return colors.error('error')
      }
      if (severity === DiagnosticSeverity.Warning) {
        return colors.warning('warning')
      }
      return colors.info('info')
    },
  })
}
