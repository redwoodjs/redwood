import path from 'path'

import task, { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'use-armor'
export const description = '(v4.x.x->v4.x.x) Converts world to bazinga'

export const handler = () => {
  task(
    'Use Armor',
    async ({ setOutput }: TaskInnerApi) => {
      await runTransform({
        transformPath: path.join(__dirname, 'useArmor.js'),
        // Here we know exactly which file we need to transform, but often times you won't.
        // If you need to transform files based on their name, location, etc, use `fast-glob`.
        // If you need to transform files based on their contents, use `getFilesWithPattern`.
        targetPaths: [path.join(getRWPaths().base, 'redwood.toml')],
      })

      setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
    }
  )
}
