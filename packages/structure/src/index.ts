export { DefaultHost, Host } from './hosts'
export { RWProject } from './model'
import { DefaultHost } from './hosts'
import { RWProject } from './model'
import {
  ExtendedDiagnostic_format,
  GetSeverityLabelFunction,
} from './x/vscode-languageserver-types'
export { DiagnosticSeverity } from 'vscode-languageserver-types'

export function getProject(projectRoot: string, host = new DefaultHost()) {
  return new RWProject({
    projectRoot,
    host,
  })
}

export async function printDiagnostics(
  projectRoot: string,
  opts?: { getSeverityLabel?: GetSeverityLabelFunction }
) {
  const project = getProject(projectRoot)
  const formatOpts = { cwd: projectRoot, ...opts }
  try {
    let warnings = 0
    let errors = 0
    for (const d of await project.collectDiagnostics()) {
      const str = ExtendedDiagnostic_format(d, formatOpts)
      console.log(str)
      // counts number of warnings (2) and errors (1) encountered
      if (d.diagnostic.severity === 2) {
        warnings++
      }
      if (d.diagnostic.severity === 1) {
        errors++
      }
    }

    if (warnings === 0 && errors === 0) {
      console.log('Success: no errors or warnings were detected')
    }
    else if (errors > 0) {
      throw new Error(`Failure: ${errors} errors and ${warnings} warnings detected`)
    }

  } catch (e: any) {
    throw new Error(e.message)
  }
}

export { URL_file } from './x/URL'
