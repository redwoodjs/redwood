import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-app'
export const description =
  '(v2.1.0->v2.2.0) Updates App.{js,tsx} to use new Clerk auth provider'

export const handler = () => {
  task('Updating App.{js,tsx}', async () => {
    const rwPaths = getRWPaths()

    console.log('targetPaths', [rwPaths.web.app])

    await runTransform({
      transformPath: path.join(__dirname, 'updateForms.js'),
      targetPaths: [rwPaths.web.app],
    })
  })
}
