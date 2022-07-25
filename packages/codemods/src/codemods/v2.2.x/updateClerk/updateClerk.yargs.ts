import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-clerk'
export const description =
  '(v2.1.0->v2.2.0) Updates App.{js,tsx} to use the new Clerk auth provider'

export const handler = () => {
  task('Updating App.{js,tsx}', async () => {
    const rwPaths = getRWPaths()

    await runTransform({
      transformPath: path.join(__dirname, 'updateClerk.js'),
      targetPaths: [rwPaths.web.app],
    })
  })
}
