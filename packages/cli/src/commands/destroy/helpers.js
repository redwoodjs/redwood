import Listr from 'listr'

import { deleteFilesTask } from 'src/lib'
import c from 'src/lib/colors'

export const createYargsForComponentDestroy = ({ componentName, filesFn }) => {
  return {
    command: `${componentName} <name>`,
    desc: `Destroy a ${componentName} component.`,
    handler: async (names) => {
      const tasks = new Listr(
        [
          {
            title: `Destroying ${componentName} files...`,
            task: async () => {
              const f = await filesFn(names)
              return deleteFilesTask(f)
            },
          },
        ],
        { collapse: false, exitOnError: true }
      )

      try {
        await tasks.run()
      } catch (e) {
        console.log(c.error(e.message))
      }
    },
  }
}
