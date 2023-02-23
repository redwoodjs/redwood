import path from 'path'

import task, { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import isTSProject from '../../../lib/isTSProject'
import runTransform from '../../../lib/runTransform'

export const command = 'update-get-current-user'
export const description =
  '(v4.1.x->v4.2.x) For Clerk users; updates the getCurrentUser function'

export const handler = () => {
  task('Update getCurrentUser', async ({ setOutput }: TaskInnerAPI) => {
    const authFile = isTSProject ? 'auth.ts' : 'auth.js'

    await runTransform({
      transformPath: path.join(__dirname, 'useArmor.js'),
      targetPaths: [path.join(getRWPaths().api.base, 'src', 'lib', authFile)],
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
