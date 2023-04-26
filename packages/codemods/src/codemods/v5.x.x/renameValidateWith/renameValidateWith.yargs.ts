import path from 'path'

import task from 'tasuku'

import getFilesWithPattern from '../../../lib/getFilesWithPattern'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'rename-validate-with'

export const description =
  '(v4.x.x->v5.x.x) Converts validateWith to validateWithSync'

export const handler = () => {
  task(
    'Renaming `validateWith` to `validateWithSync`',
    async ({ setOutput }) => {
      const rwPaths = getRWPaths()

      const files = getFilesWithPattern({
        pattern: 'validateWith',
        filesToSearch: [rwPaths.api.src],
      })

      await runTransform({
        transformPath: path.join(__dirname, 'renameValidateWith.js'),
        targetPaths: files,
      })

      setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
    }
  )
}
