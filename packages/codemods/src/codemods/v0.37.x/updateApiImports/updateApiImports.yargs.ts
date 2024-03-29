import path from 'path'

import task from 'tasuku'

import { getPaths } from '@redwoodjs/project-config'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import runTransform from '../../../lib/runTransform'

export const command = 'update-api-imports'
export const description =
  '(v0.36->v0.37) Updates @redwoodjs/api imports to @redwoodjs/graphql-server'

export const handler = () => {
  task(
    'Updating @redwoodjs/api imports',
    async ({ setWarning }: { setWarning: any }) => {
      const rwPaths = getPaths()

      const files = getFilesWithPattern({
        pattern: `from '@redwoodjs/api'`,
        filesToSearch: [rwPaths.api.src],
      })

      if (files.length === 0) {
        setWarning('No files found')
      } else {
        await runTransform({
          transformPath: path.join(__dirname, 'updateApiImports.js'),
          targetPaths: files,
        })
      }
    },
  )
}
