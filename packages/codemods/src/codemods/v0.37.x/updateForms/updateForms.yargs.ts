import path from 'path'

import task from 'tasuku'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-forms'
export const description =
  '(v0.36->v0.37) Updates @redwoodjs/forms props and coercion'

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
        transformPath: path.join(__dirname, 'updateForms.js'),
        targetPaths: files,
      })
    }
  })
}
