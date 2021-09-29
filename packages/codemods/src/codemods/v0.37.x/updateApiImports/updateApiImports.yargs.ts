import path from 'path'

import task from 'tasuku'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-api-imports'
export const description =
  'Updates @redwoodjs/api imports to @redwoodjs/graphql-server'

export const handler = () => {
  task(
    'Updating @redwoodjs/api imports',
    async ({ setWarning }: { setWarning: any }) => {
      const rwPaths = getRWPaths()

      const files = getFilesWithPattern({
        pattern: `from '@redwoodjs/api'`,
        filesToSearch: [rwPaths.api.src],
      })

      if (files.length === 0) {
        setWarning('No files found')
      } else {
        runTransform({
          transformPath: path.join(__dirname, 'updateApiImports.js'),
          targetPaths: files,
        })
      }
    }
  )
}
