import fs from 'fs'
import path from 'path'

import { getPaths, transformTSToJS } from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

const OUTPUT_PATHS = {
  auth: path.join(
    getPaths().api.lib,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  ),
  function: path.join(
    getPaths().api.functions,
    isTypeScriptProject() ? 'auth.ts' : 'auth.js'
  ),
}

/**
 * Example return value:
 * ```
 * {
 *   base: [
 *     '/Users/tobbe/dev/redwood/.../auth/templates/auth.ts.template'
 *   ],
 *   clerk: [
 *     '/Users/tobbe/dev/redwood/.../auth/templates/clerk.auth.ts.template'
 *   ],
 *   dbAuth: [
 *     '/Users/tobbe/dev/redwood/.../auth/templates/dbAuth.auth.ts.template',
 *     '/Users/tobbe/dev/redwood/.../auth/templates/dbAuth.auth.webAuthn.ts.template',
 *     '/Users/tobbe/dev/redwood/.../auth/templates/dbAuth.function.ts.template',
 *     '/Users/tobbe/dev/redwood/.../auth/templates/dbAuth.function.webAuthn.ts.template'
 *   ],
 *   ethereum: [
 *     '/Users/tobbe/dev/redwood/.../setup/auth/templates/ethereum.auth.ts.template'
 *   ],
 * }
 * ```
 *
 * @returns Object where the providers are mapped to their templates
 */

const getTemplates = () =>
  fs
    .readdirSync(path.join(path.resolve(__dirname, 'templates'), 'lib'))
    .reduce((templates, file) => {
      // Create a fake 'base' provider for the standard auth.ts template
      const provider = file === 'auth.ts.template' ? 'base' : file.split('.')[0]

      return {
        ...templates,
        [provider]: [
          ...(templates[provider] || []),
          path.resolve(__dirname, 'templates', 'lib', file),
        ],
      }
    }, {})

/**
 * Get the auth.ts template to use
 *
 * @returns {
 *   'auth.ts': <file content>
 * }
 */
export const files = ({ provider, webAuthn }) => {
  const templates = getTemplates()
  let files = {}

  templates[provider]?.forEach((templateFile) => {
    const shouldUseTemplate =
      (webAuthn && templateFile.match(/\.webAuthn\./)) ||
      (!webAuthn && !templateFile.match(/\.webAuthn\./))

    if (shouldUseTemplate) {
      const outputPath = OUTPUT_PATHS[path.basename(templateFile).split('.')[1]]
      const content = fs.readFileSync(templateFile).toString()
      files = Object.assign(files, {
        [outputPath]: isTypeScriptProject()
          ? content
          : transformTSToJS(outputPath, content),
      })
    }
  })

  // if there are no provider-specific templates, just use the base auth one
  if (Object.keys(files).length === 0) {
    const content = fs.readFileSync(templates.base[0]).toString()
    files = {
      [OUTPUT_PATHS.auth]: isTypeScriptProject()
        ? content
        : transformTSToJS(templates.base[0], content),
    }
  }

  return files
}
