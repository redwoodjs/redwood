import path from 'path'

import task from 'tasuku'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'use-rhf-coercion'
export const description = 'Updates forms to have rhf coercion'

export const handler = () => {
  task('Updating forms', async ({ setWarning }: { setWarning: any }) => {
    const rwPaths = getRWPaths()

    const files = getFilesWithPattern({
      pattern: 'Form',
      filesToSearch: [rwPaths.web.src],
    })

    if (files.length === 0) {
      setWarning('No files found')
    } else {
      runTransform({
        transformPath: path.join(__dirname, 'useRHFCoercion.js'),
        targetPaths: files,
      })
    }
  })
}
