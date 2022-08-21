import fs from 'fs'
import path from 'path'

import { getPaths, transformTSToJS } from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

/**
 * Get the file paths and file contents to write
 *
 * @returns {
 *   '/Users/tobbe/dev/rw-app/api/src/lib/auth.ts': <file content>
 *   '/Users/tobbe/dev/rw-app/api/src/lib/helperFunctions.ts': <file content>
 *   '/Users/tobbe/dev/rw-app/api/src/functions/auth.ts': <file content>
 * }
 */
export const files = ({ provider, webAuthn }) => {
  const apiBasePath = getPaths().api.base

  const apiBaseTemplatePath = path.join(
    path.resolve(__dirname, 'providers'),
    provider,
    'templates',
    'api'
  )

  const templateDirectories = fs.readdirSync(apiBaseTemplatePath)

  const filesRecord = templateDirectories.reduce((acc, dir) => {
    const templateFiles = fs.readdirSync(path.join(apiBaseTemplatePath, dir))
    const filePaths = templateFiles
      .filter((fileName) => {
        const fileNameParts = fileName.split('.')
        // Remove all webAuthn files. We'll handle those in the next step
        return fileNameParts.length <= 3 || fileNameParts.at(-3) !== 'webAuthn'
      })
      .map((fileName) => {
        // remove "template" from the end
        const outputFileName = fileName.replace(/\.template$/, '')

        if (!webAuthn) {
          return { templateFileName: fileName, outputFileName }
        }

        // Insert "webAuthn." before the second to last part
        const webAuthnFileName = fileName
          .split('.')
          .reverse()
          .map((part, i) => (i === 1 ? 'webAuthn.' + part : part))
          .reverse()
          .join('.')

        // Favor the abc.xyz.webAuthn.ts.template file if it exists, otherwise
        // just go with the "normal" filename
        if (templateFiles.includes(webAuthnFileName)) {
          return { templateFileName: webAuthnFileName, outputFileName }
        } else {
          return { templateFileName: fileName, outputFileName }
        }
      })
      .map((f) => {
        const templateFilePath = path.join(
          apiBaseTemplatePath,
          dir,
          f.templateFileName
        )
        const outputFilePath = path.join(apiBasePath, dir, f.outputFileName)

        return { templateFilePath, outputFilePath }
      })

    filePaths.forEach((paths) => {
      const content = fs.readFileSync(paths.templateFilePath, 'utf8')

      acc = {
        ...acc,
        [paths.outputFilePath]: isTypeScriptProject()
          ? content
          : transformTSToJS(paths.outputFilePath, content),
      }
    })

    return acc
  }, {})

  return filesRecord
}
