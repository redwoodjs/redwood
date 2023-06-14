import path from 'path'

import task, { TaskInnerAPI } from 'tasuku'

import { getPaths } from '@redwoodjs/project-config'
import runTransform from '../../../lib/runTransform'

export const command = 'process-env-dot-notation'
export const description = '(v6.x.x->v6.x.x) Converts world to bazinga'

export const handler = () => {
  task(
    'Process Env Dot Notation',
    async ({ setOutput }: TaskInnerAPI) => {
      await runTransform({
        transformPath: path.join(__dirname, 'processEnvDotNotation.js'),
        // Here we know exactly which file we need to transform, but often times you won't.
        // If you need to transform files based on their name, location, etc, use `fast-glob`.
        // If you need to transform files based on their contents, use `getFilesWithPattern`.
        targetPaths: fg.sync('**/*.{js,jsx,tsx}', {
          cwd: getPaths().web.src,
          absolute: true,
        }),
      })

      setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
    }
  )
}
