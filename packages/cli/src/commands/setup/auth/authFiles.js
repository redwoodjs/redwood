import fs from 'fs'
import path from 'path'

import { getPaths, transformTSToJS } from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

/**
 * Get the auth.ts templates to use
 *
 * @returns {
 *   '/Users/tobbe/dev/rw-app/api/src/lib/auth.ts': <file content>
 *   '/Users/tobbe/dev/rw-app/api/src/functions/auth.ts': <file content>
 * }
 */
export const files = ({ provider, webAuthn }) => {
  const libAuthPath = path.join(
    getPaths().api.lib,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  )

  const functionsAuthPath = path.join(
    getPaths().api.functions,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  )

  const libAuthTemplatePath = path.join(
    path.resolve(__dirname, 'providers'),
    provider,
    'templates',
    'api',
    'lib',
    webAuthn ? 'auth.webAuthn.ts.template' : 'auth.ts.template'
  )

  const functionsAuthTemplatePath = path.join(
    path.resolve(__dirname, 'providers'),
    provider,
    'templates',
    'api',
    'functions',
    webAuthn ? 'auth.webAuthn.ts.template' : 'auth.ts.template'
  )

  const libAuthContent = fs.readFileSync(libAuthTemplatePath, 'utf8')

  const functionsAuthContent = fs.existsSync(functionsAuthTemplatePath)
    ? fs.readFileSync(functionsAuthTemplatePath)
    : undefined

  const files = {}

  files[libAuthPath] = isTypeScriptProject
    ? libAuthContent
    : transformTSToJS(libAuthPath, libAuthContent)

  if (functionsAuthContent) {
    files[functionsAuthPath] = isTypeScriptProject
      ? functionsAuthContent
      : transformTSToJS(functionsAuthPath, functionsAuthContent)
  }

  return files
}
