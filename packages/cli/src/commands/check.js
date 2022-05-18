export const command = 'check'

export const aliases = ['diagnostics']

export const description =
  'Get structural diagnostics for a Redwood project (experimental)'

export async function handler(argv) {
  const { printDiagnostics, DiagnosticSeverity } = await import(
    '@redwoodjs/structure'
  )
  const { redwoodProject, colors } = argv

  printDiagnostics(redwoodProject.paths.base, {
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
