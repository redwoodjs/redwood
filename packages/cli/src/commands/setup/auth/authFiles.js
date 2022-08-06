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

const getTemplates = () =>
  fs
    .readdirSync(path.resolve(__dirname, 'templates'))
    .reduce((templates, file) => {
      if (file === 'auth.ts.template') {
        return {
          ...templates,
          base: [path.resolve(__dirname, 'templates', file)],
        }
      } else {
        const provider = file.split('.')[0]
        if (templates[provider]) {
          templates[provider].push(path.resolve(__dirname, 'templates', file))
          return { ...templates }
        } else {
          return {
            ...templates,
            [provider]: [path.resolve(__dirname, 'templates', file)],
          }
        }
      }
    }, {})

// the files to create to support auth
export const files = ({ provider, webAuthn }) => {
  const templates = getTemplates()
  let files = {}

  // look for any templates for this provider
  for (const [templateProvider, templateFiles] of Object.entries(templates)) {
    if (provider === templateProvider) {
      templateFiles.forEach((templateFile) => {
        const shouldUseTemplate =
          (webAuthn && templateFile.match(/\.webAuthn\./)) ||
          (!webAuthn && !templateFile.match(/\.webAuthn\./))

        if (shouldUseTemplate) {
          const outputPath =
            OUTPUT_PATHS[path.basename(templateFile).split('.')[1]]
          const content = fs.readFileSync(templateFile).toString()
          files = Object.assign(files, {
            [outputPath]: isTypeScriptProject()
              ? content
              : transformTSToJS(outputPath, content),
          })
        }
      })
    }
  }

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
