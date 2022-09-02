import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'configure-fastify'
export const description =
  '(v2.x.x->v2.x.x) Updates api side’s server.config.js to configure Fastify'

export const handler = () => {
  task('Configure Fastify', async ({ setOutput }: task.TaskInnerApi) => {
    await runTransform({
      transformPath: path.join(__dirname, 'configureFastify.js'),
      targetPaths: [__dirname],
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
