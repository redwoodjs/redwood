import path from 'path'

import task, { TaskInnerAPI } from 'tasuku'

import getFilesWithPattern from '../../..//lib/getFilesWithPattern'
import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'change-src-imports'
export const description =
  '(v-experimental-streaming.x->v-experimental-streaming.x) Converts src imports to api/src'

export const handler = () => {
  task('Change Src Imports', async ({ setOutput }: TaskInnerAPI) => {
    const apiSrcFiles = getFilesWithPattern({
      pattern: `from 'src/`,
      filesToSearch: [getRWPaths().api.src],
    })

    await runTransform({
      transformPath: path.join(__dirname, 'changeSrcImports.js'),
      // Here we know exactly which file we need to transform, but often times you won't.
      // If you need to transform files based on their name, location, etc, use `fast-glob`.
      // If you need to transform files based on their contents, use `getFilesWithPattern`.
      targetPaths: apiSrcFiles,
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
