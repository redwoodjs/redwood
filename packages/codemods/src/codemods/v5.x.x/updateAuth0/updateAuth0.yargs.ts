import path from 'path'

import task, { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import runTransform from '../../../lib/runTransform'

export const command = 'update-auth0'
export const description =
  '(v4.x.x->v5.x.x) For Auth0 users; updates the web-side auth.ts,js file'

export const handler = () => {
  task('Update Auth0', async ({ setOutput }: TaskInnerAPI) => {
    const authFile = isTSProject ? 'auth.ts' : 'auth.js'

    // TODO: upgrade web-side auth0 package

    await runTransform({
      transformPath: path.join(__dirname, 'updateAuth0.js'),
      targetPaths: [path.join(getRWPaths().web.src, authFile)],
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
