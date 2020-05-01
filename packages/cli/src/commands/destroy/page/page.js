import camelcase from 'camelcase'
import Listr from 'listr'

import { deleteFilesTask, removeRoutesFromRouterTask } from 'src/lib'
import c from 'src/lib/colors'

import { pathName } from '../../generate/helpers'
import { files } from '../../generate/page/page'

export const command = 'page <name> [path]'
export const desc = 'Destroy a page component.'

export const handler = async ({ name, path }) => {
  const tasks = new Listr(
    [
      {
        title: 'Destroying page files...',
        task: async () => {
          const f = files({ name, path: pathName(path, name) })
          return deleteFilesTask(f)
        },
      },
      {
        title: 'Cleaning up routes file...',
        task: async () => removeRoutesFromRouterTask([camelcase(name)]),
      },
    ],
    { collapse: false }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
