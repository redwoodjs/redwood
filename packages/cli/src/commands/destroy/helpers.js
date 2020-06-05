import Listr from 'listr'

import { deleteFilesTask } from 'src/lib'
import c from 'src/lib/colors'

const tasks = ({ componentName, filesFn, name }) =>
  new Listr(
    [
      {
        title: `Destroying ${componentName} files...`,
        task: async () => {
          const f = await filesFn({ name })
          return deleteFilesTask(f)
        },
      },
    ],
    { collapse: false, exitOnError: true }
  )

export const createYargsForComponentDestroy = ({ componentName, filesFn }) => {
  return {
    command: `${componentName} <name>`,
    description: `Destroy a ${componentName} component`,
    builder: (yargs) => {
      yargs.positional('name', {
        description: `Name of the ${componentName}`,
        type: 'string',
      })
    },
    handler: async ({ name }) => {
      const t = tasks({ componentName, filesFn, name })

      try {
        await t.run()
      } catch (e) {
        console.log(c.error(e.message))
      }
    },
    tasks,
  }
}
