export { DefaultHost, Host } from './ide'
export { RWProject } from './model'
import { DefaultHost } from './ide'
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
    for (const d of await project.collectDiagnostics()) {
      const str = ExtendedDiagnostic_format(d, formatOpts)
      console.log(str)
    }
  } catch (e) {
    console.log('runtime error: ' + e.message)
  }
}

export { URL_file } from './x/URL'
