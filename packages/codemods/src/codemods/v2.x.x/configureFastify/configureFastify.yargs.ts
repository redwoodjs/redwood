import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import prettify from '../../../lib/prettify'
import runTransform from '../../../lib/runTransform'

export const command = 'configure-fastify'
export const description =
  '(v2.x.x->v2.x.x) Updates api side’s server.config.js to configure Fastify'

export const handler = () => {
  task('Configure Fastify', async ({ setOutput }: task.TaskInnerApi) => {
    const [API_SERVER_CONFIG_PATH] = fg.sync('server.config.{js,ts}', {
      cwd: getRWPaths().api.base,
      absolute: true,
    })

    await runTransform({
      transformPath: path.join(__dirname, 'configureFastify.js'),
      targetPaths: [API_SERVER_CONFIG_PATH],
    })

    // The transform generates two extra semicolons for some reason:
    //
    // ```js
    // module.exports = { config };;
    // ```
    //
    // They don't show up in tets cause we run prettier. Let's do the same here.
    fs.writeFileSync(
      API_SERVER_CONFIG_PATH,
      prettify(fs.readFileSync(API_SERVER_CONFIG_PATH, 'utf-8'))
    )

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
