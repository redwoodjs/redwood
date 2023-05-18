import path from 'path'

import task from 'tasuku'

import { getPaths } from '@redwoodjs/project-config'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import runTransform from '../../../lib/runTransform'

export const command = 'update-forms'
export const description = '(v0.36->v0.37) Updates @redwoodjs/forms props'

export const handler = () => {
  task('Updating forms', async ({ setWarning }: { setWarning: any }) => {
    const rwPaths = getPaths()

    const files = getFilesWithPattern({
      pattern: 'Form',
      filesToSearch: [rwPaths.web.src],
    })

    if (files.length === 0) {
      setWarning('No files found')
    } else {
      await runTransform({
        transformPath: path.join(__dirname, 'updateForms.js'),
        targetPaths: files,
      })
    }
  })
}
