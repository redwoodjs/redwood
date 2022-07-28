import path from 'path'

import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'configure-fastify'
export const description = '(v2.x.x->v2.x.x) Converts world to bazinga'

export const handler = () => {
  task('Configure Fastify', async ({ setOutput }: task.TaskInnerApi) => {
    await runTransform({
      transformPath: path.join(__dirname, 'configureFastify.js'),
      // Here we know exactly which file we need to transform, but often times you won't.
      // If you need to transform files based on their name, location, etc, use `fast-glob`.
      // If you need to transform files based on their contents, use `getFilesWithPattern`.
      targetPaths: [path.join(getRWPaths().base, 'redwood.toml')],
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
