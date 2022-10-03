import { Listr } from 'listr2'

import { deleteFilesTask } from '../../lib'
import c from '../../lib/colors'

const tasks = ({ componentName, filesFn, name }) =>
  new Listr(
    [
      {
        title: `Destroying ${componentName} files...`,
        task: async () => {
          const f = await filesFn({ name, stories: true, tests: true })
          return deleteFilesTask(f)
        },
      },
    ],
    { rendererOptions: { collapse: false }, exitOnError: true }
  )

export const createYargsForComponentDestroy = ({
  componentName,
  preTasksFn = (options) => options,
  filesFn,
}) => {
  return {
    command: `${componentName} <name>`,
    description: `Destroy a ${componentName} component`,
    builder: (yargs) => {
      yargs.positional('name', {
        description: `Name of the ${componentName}`,
        type: 'string',
      })
    },
    handler: async (options) => {
      try {
        options = await preTasksFn({ ...options, isDestroyer: true })
        await tasks({ componentName, filesFn, name: options.name }).run()
      } catch (e) {
        console.log(c.error(e.message))
      }
    },
    tasks,
  }
}
